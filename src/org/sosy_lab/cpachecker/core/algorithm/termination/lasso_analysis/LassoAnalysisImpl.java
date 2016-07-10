/*
 *  CPAchecker is a tool for configurable software verification.
 *  This file is part of CPAchecker.
 *
 *  Copyright (C) 2007-2016  Dirk Beyer
 *  All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 *
 *  CPAchecker web page:
 *    http://cpachecker.sosy-lab.org
 */
package org.sosy_lab.cpachecker.core.algorithm.termination.lasso_analysis;

import static com.google.common.base.Preconditions.checkNotNull;

import com.google.common.collect.ImmutableList;

import org.sosy_lab.common.ShutdownNotifier;
import org.sosy_lab.common.configuration.Configuration;
import org.sosy_lab.common.configuration.IntegerOption;
import org.sosy_lab.common.configuration.InvalidConfigurationException;
import org.sosy_lab.common.configuration.Option;
import org.sosy_lab.common.configuration.Options;
import org.sosy_lab.common.log.LogManager;
import org.sosy_lab.cpachecker.cfa.CFA;
import org.sosy_lab.cpachecker.cfa.ast.c.CVariableDeclaration;
import org.sosy_lab.cpachecker.core.AnalysisDirection;
import org.sosy_lab.cpachecker.core.algorithm.termination.LassoAnalysis;
import org.sosy_lab.cpachecker.core.algorithm.termination.RankingRelation;
import org.sosy_lab.cpachecker.core.algorithm.termination.TerminationStatistics;
import org.sosy_lab.cpachecker.core.algorithm.termination.lasso_analysis.construction.LassoBuilder;
import org.sosy_lab.cpachecker.core.algorithm.termination.lasso_analysis.toolchain.LassoRankerToolchainStorage;
import org.sosy_lab.cpachecker.core.counterexample.CounterexampleInfo;
import org.sosy_lab.cpachecker.exceptions.CPATransferException;
import org.sosy_lab.cpachecker.exceptions.UnrecognizedCCodeException;
import org.sosy_lab.cpachecker.util.predicates.pathformula.PathFormulaManager;
import org.sosy_lab.cpachecker.util.predicates.pathformula.PathFormulaManagerImpl;
import org.sosy_lab.cpachecker.util.predicates.smt.FormulaManagerView;
import org.sosy_lab.solver.SolverException;
import org.sosy_lab.solver.api.SolverContext;
import org.sosy_lab.solver.basicimpl.AbstractFormulaManager;

import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import java.util.logging.Level;

import de.uni_freiburg.informatik.ultimate.lassoranker.AnalysisType;
import de.uni_freiburg.informatik.ultimate.lassoranker.Lasso;
import de.uni_freiburg.informatik.ultimate.lassoranker.LassoRankerPreferences;
import de.uni_freiburg.informatik.ultimate.lassoranker.exceptions.TermException;
import de.uni_freiburg.informatik.ultimate.lassoranker.nontermination.NonTerminationAnalysisSettings;
import de.uni_freiburg.informatik.ultimate.lassoranker.nontermination.NonTerminationArgument;
import de.uni_freiburg.informatik.ultimate.lassoranker.nontermination.NonTerminationArgumentSynthesizer;
import de.uni_freiburg.informatik.ultimate.lassoranker.termination.TerminationAnalysisSettings;
import de.uni_freiburg.informatik.ultimate.lassoranker.termination.TerminationArgument;
import de.uni_freiburg.informatik.ultimate.lassoranker.termination.TerminationArgumentSynthesizer;
import de.uni_freiburg.informatik.ultimate.lassoranker.termination.templates.AffineTemplate;
import de.uni_freiburg.informatik.ultimate.lassoranker.termination.templates.LexicographicTemplate;
import de.uni_freiburg.informatik.ultimate.lassoranker.termination.templates.RankingTemplate;
import de.uni_freiburg.informatik.ultimate.logic.SMTLIBException;
import de.uni_freiburg.informatik.ultimate.logic.Script.LBool;
import de.uni_freiburg.informatik.ultimate.logic.Term;
import de.uni_freiburg.informatik.ultimate.util.ToolchainCanceledException;

@Options(prefix="termination.lassoAnalysis")
public class LassoAnalysisImpl implements LassoAnalysis {

  // The configuration library does not support small letters in enum constants.
  public enum LassoAnalysisType {

    /**
     * @see AnalysisType#Disabled
     */
    DISABLED(AnalysisType.Disabled),

    /**
     * @see AnalysisType#Linear
     */
    LINEAR(AnalysisType.Linear),

    /**
     * @see AnalysisType#Linear_with_guesses
     */
    LINEAR_WITH_GUESSES(AnalysisType.Linear_with_guesses),

    /**
     * @see AnalysisType#Nonlinear
     */
    NONLINEAR(AnalysisType.Nonlinear);

    private final AnalysisType analysisType;

    private LassoAnalysisType(AnalysisType pAnalysisType) {
      analysisType = pAnalysisType;
    }

    private AnalysisType toAnalysisType() {
       return analysisType;
    }
  }

  private final LogManager logger;
  private final ShutdownNotifier shutdownNotifier;
  private final TerminationStatistics statistics;

  private final AbstractFormulaManager<Term, ?, ?, ?> formulaManager;
  private final FormulaManagerView formulaManagerView;
  private final PathFormulaManager pathFormulaManager;

  private final LassoBuilder lassoBuilder;
  private final RankingRelationBuilder rankingRelationBuilder;

  private final LassoRankerPreferences lassoRankerPreferences;
  private final NonTerminationAnalysisSettings nonTerminationAnalysisSettings;
  private final TerminationAnalysisSettings terminationAnalysisSettings;

  private final LassoRankerToolchainStorage toolchainStorage;

  private final Collection<RankingTemplate> rankingTemplates;

  @Option(
      secure = true,
      description = "Number of non-strict supporting invariants for each Motzkin transformation "
          + "during synthesis of termination arguments."
    )
  @IntegerOption(min = 0)
  private int nonStrictInvariants = 3;

  @Option(
      secure = true,
      description = "Number of strict supporting invariants for each Motzkin transformation "
          + "during synthesis of termination arguments."
    )
  @IntegerOption(min = 0)
  private int strictInvariants = 2;

  @Option(
      secure = true,
      description = "Analysis type used for synthesis of termination arguments."
    )
  private LassoAnalysisType analysisType = LassoAnalysisType.LINEAR_WITH_GUESSES;

  @Option(
      secure = true,
      description =
          "If true, an external tool is used as SMT solver instead of SMTInterpol."
    )
  private boolean externalSolver = false;

  @Option(
      secure = true,
      description = "Shell command used to call the external SMT solver."
    )
  private String externalSolverCommand =
      "./lib/native/x86_64-linux/z3 -smt2 -in SMTLIB2_COMPLIANT=true ";

  @SuppressWarnings("unchecked")
  public LassoAnalysisImpl(
      LogManager pLogger,
      Configuration pConfig,
      ShutdownNotifier pShutdownNotifier,
      SolverContext pSolverContext,
      CFA pCfa,
      TerminationStatistics pStatistics)
      throws InvalidConfigurationException {

    pConfig.inject(this);
    logger = checkNotNull(pLogger);
    shutdownNotifier = checkNotNull(pShutdownNotifier);
    statistics = checkNotNull(pStatistics);
    Configuration solverConfig = Configuration.defaultConfiguration();
    formulaManager = (AbstractFormulaManager<Term, ?, ?, ?>) pSolverContext.getFormulaManager();
    formulaManagerView = new FormulaManagerView(formulaManager, solverConfig, pLogger);
    pathFormulaManager =
        new PathFormulaManagerImpl(
            formulaManagerView,
            pConfig,
            pLogger,
            pShutdownNotifier,
            pCfa,
            AnalysisDirection.FORWARD);

    lassoBuilder =
        new LassoBuilder(
            pLogger,
            shutdownNotifier,
            formulaManager,
            formulaManagerView,
            pSolverContext::newProverEnvironment,
            pathFormulaManager);
    rankingRelationBuilder =
        new RankingRelationBuilder(pCfa.getMachineModel(), pLogger, formulaManagerView);

    lassoRankerPreferences = new LassoRankerPreferences();
    lassoRankerPreferences.smt_solver_command = externalSolverCommand;
    lassoRankerPreferences.externalSolver = externalSolver;

    nonTerminationAnalysisSettings = new NonTerminationAnalysisSettings();
    terminationAnalysisSettings = new TerminationAnalysisSettings();
    terminationAnalysisSettings.analysis = analysisType.toAnalysisType();
    terminationAnalysisSettings.numnon_strict_invariants = nonStrictInvariants;
    terminationAnalysisSettings.numstrict_invariants = strictInvariants;
    toolchainStorage = new LassoRankerToolchainStorage(pLogger, pShutdownNotifier);

    rankingTemplates = createTemplates();
  }

  private static Collection<RankingTemplate> createTemplates() {
    ImmutableList.Builder<RankingTemplate> rankingTemplates = ImmutableList.builder();

    rankingTemplates.add(new AffineTemplate());

    rankingTemplates.add(new LexicographicTemplate(2));
    rankingTemplates.add(new LexicographicTemplate(3));
    rankingTemplates.add(new LexicographicTemplate(4));

    return rankingTemplates.build();
  }

  @Override
  public void close() {
    toolchainStorage.clear();
  }

  @Override
  public LassoAnalysisResult checkTermination(
      CounterexampleInfo pCounterexample, Set<CVariableDeclaration> pRelevantVariables)
      throws CPATransferException, InterruptedException {
    statistics.analysisOfLassosStarted();
    try {
      return checkTermination0(pCounterexample, pRelevantVariables);
    } finally {
      statistics.analysisOfLassosFinished();
    }
  }

  private LassoAnalysisResult checkTermination0(
      CounterexampleInfo pCounterexample, Set<CVariableDeclaration> pRelevantVariables)
      throws CPATransferException, InterruptedException {
    Collection<Lasso> lassos;
    statistics.lassoConstructionStarted();
    try {
      lassos = lassoBuilder.buildLasso(pCounterexample, pRelevantVariables);
      statistics.lassosConstructed(lassos.size());
    } catch (TermException | SolverException e) {
      logger.logUserException(Level.WARNING, e, "Could not extract lasso.");
      return LassoAnalysisResult.unknown();
    } finally {
      statistics.lassoConstructionFinished();
    }

    try {
      return checkTermination(lassos, pRelevantVariables);
    } catch (IOException | SMTLIBException | TermException e) {
      logger.logUserException(Level.WARNING, e, "Could not check (non)-termination of lasso.");
      return LassoAnalysisResult.unknown();
    } catch (ToolchainCanceledException e) {
      throw new InterruptedException(e.getMessage());
    }
  }

  private LassoAnalysisResult checkTermination(
      Collection<Lasso> lassos, Set<CVariableDeclaration> pRelevantVariables)
      throws IOException, SMTLIBException, TermException, InterruptedException {

    LassoAnalysisResult result = LassoAnalysisResult.unknown();

    // Try to synthesize non-termination arguments first because it is much cheaper
    // than synthesizing termination arguments.
    for (Lasso lasso : lassos) {
      shutdownNotifier.shutdownIfNecessary();
      logger.logf(Level.FINE, "Synthesizing non-termination argument for lasso:\n%s.", lasso);
      LassoAnalysisResult resultFromLasso = synthesizeNonTerminationArgument(lasso);
      result = result.update(resultFromLasso);

      // Stop and return result if non-termination could be proved.
      if (result.hasNonTerminationArgument()) {
        return result;
      }
    }

    // Synthesize termination arguments
    for (Lasso lasso : lassos) {
      shutdownNotifier.shutdownIfNecessary();
      logger.logf(Level.FINE, "Synthesizing termination argument for lasso:\n%s.", lasso);
      LassoAnalysisResult resultFromLasso = synthesizeTerminationArgument(lasso, pRelevantVariables);
      result = result.update(resultFromLasso);
    }

    return result;
  }

  private LassoAnalysisResult synthesizeNonTerminationArgument(Lasso lasso)
      throws IOException, SMTLIBException, TermException {

    statistics.nonTerminationAnalysisOfLassoStarted();
    NonTerminationArgument nonTerminationArgument = null;
    try (NonTerminationArgumentSynthesizer nonTerminationArgumentSynthesizer =
        createNonTerminationArgumentSynthesizer(lasso)) {

      LBool result = nonTerminationArgumentSynthesizer.synthesize();
      if (result.equals(LBool.SAT) && nonTerminationArgumentSynthesizer.synthesisSuccessful()) {
        nonTerminationArgument = nonTerminationArgumentSynthesizer.getArgument();
        logger.logf(Level.INFO, "Proved non-termintion: %s", nonTerminationArgument);
        return LassoAnalysisResult.fromNonTerminationArgument(nonTerminationArgument);

      } else {
        return LassoAnalysisResult.unknown();
      }

    } finally {
      statistics.nonTerminationAnalysisOfLassoFinished();
    }
  }

  private LassoAnalysisResult synthesizeTerminationArgument(
      Lasso lasso, Set<CVariableDeclaration> pRelevantVariables)
      throws IOException, SMTLIBException, TermException, InterruptedException {

    RankingRelation rankingRelation = null;
    statistics.terminationAnalysisOfLassoStarted();
    try {
      for (RankingTemplate rankingTemplate : rankingTemplates) {
        shutdownNotifier.shutdownIfNecessary();

        try (TerminationArgumentSynthesizer terminationArgumentSynthesizer =
            createTerminationArgumentSynthesizer(lasso, rankingTemplate)) {

          LBool result = terminationArgumentSynthesizer.synthesize();
          if (result.equals(LBool.SAT) && terminationArgumentSynthesizer.synthesisSuccessful()) {
            TerminationArgument terminationArgument = terminationArgumentSynthesizer.getArgument();
            logger.logf(Level.FINE, "Found termination argument: %s", terminationArgument);

            try {
              rankingRelation =
                  rankingRelationBuilder.fromTerminationArgument(
                      terminationArgument, pRelevantVariables);
              return LassoAnalysisResult.fromTerminationArgument(rankingRelation);

            } catch (UnrecognizedCCodeException e) {
              logger.logException(
                  Level.WARNING, e, "Could not create ranking relation from " + pRelevantVariables);
            }
          }
        }
      }
    } finally {
      statistics.terminationAnalysisOfLassoFinished();
    }

    return LassoAnalysisResult.unknown();
  }

  private TerminationArgumentSynthesizer createTerminationArgumentSynthesizer(
      Lasso lasso, RankingTemplate template) throws IOException {
    return new TerminationArgumentSynthesizer(
        lasso,
        template,
        lassoRankerPreferences,
        terminationAnalysisSettings,
        Collections.emptySet(),
        toolchainStorage,
        toolchainStorage);
  }

  private NonTerminationArgumentSynthesizer createNonTerminationArgumentSynthesizer(Lasso lasso)
      throws IOException {
    return new NonTerminationArgumentSynthesizer(
        lasso,
        lassoRankerPreferences,
        nonTerminationAnalysisSettings,
        toolchainStorage,
        toolchainStorage);
  }
}
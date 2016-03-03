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
package org.sosy_lab.cpachecker.cpa.predicate;

import static com.google.common.base.Preconditions.checkNotNull;
import static com.google.common.base.Predicates.equalTo;
import static com.google.common.collect.FluentIterable.from;
import static com.google.common.collect.Iterables.*;
import static com.google.common.collect.Lists.newArrayList;
import static org.sosy_lab.cpachecker.core.algorithm.bmc.AbstractLocationFormulaInvariant.makeLocationInvariant;
import static org.sosy_lab.cpachecker.cpa.arg.ARGUtils.getAllStatesOnPathsTo;
import static org.sosy_lab.cpachecker.cpa.predicate.InvariantsManager.InvariantUsageStrategy.*;
import static org.sosy_lab.cpachecker.util.AbstractStates.*;

import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;

import javax.annotation.Nullable;

import org.sosy_lab.common.ShutdownManager;
import org.sosy_lab.common.ShutdownNotifier;
import org.sosy_lab.common.configuration.Configuration;
import org.sosy_lab.common.configuration.FileOption;
import org.sosy_lab.common.configuration.InvalidConfigurationException;
import org.sosy_lab.common.configuration.Option;
import org.sosy_lab.common.configuration.Options;
import org.sosy_lab.common.configuration.TimeSpanOption;
import org.sosy_lab.common.io.Path;
import org.sosy_lab.common.io.PathCounterTemplate;
import org.sosy_lab.common.log.LogManager;
import org.sosy_lab.common.time.TimeSpan;
import org.sosy_lab.cpachecker.cfa.CFA;
import org.sosy_lab.cpachecker.cfa.CProgramScope;
import org.sosy_lab.cpachecker.cfa.DummyScope;
import org.sosy_lab.cpachecker.cfa.Language;
import org.sosy_lab.cpachecker.cfa.model.CFANode;
import org.sosy_lab.cpachecker.cfa.parser.Scope;
import org.sosy_lab.cpachecker.core.algorithm.bmc.AbstractLocationFormulaInvariant;
import org.sosy_lab.cpachecker.core.algorithm.bmc.CandidateGenerator;
import org.sosy_lab.cpachecker.core.algorithm.bmc.CandidateInvariant;
import org.sosy_lab.cpachecker.core.algorithm.bmc.StaticCandidateProvider;
import org.sosy_lab.cpachecker.core.algorithm.invariants.CPAInvariantGenerator;
import org.sosy_lab.cpachecker.core.algorithm.invariants.InvariantGenerator;
import org.sosy_lab.cpachecker.core.algorithm.invariants.InvariantSupplier;
import org.sosy_lab.cpachecker.core.algorithm.invariants.KInductionInvariantChecker;
import org.sosy_lab.cpachecker.core.interfaces.AbstractState;
import org.sosy_lab.cpachecker.cpa.arg.ARGPath;
import org.sosy_lab.cpachecker.cpa.arg.ARGState;
import org.sosy_lab.cpachecker.cpa.arg.ARGUtils;
import org.sosy_lab.cpachecker.cpa.automaton.Automaton;
import org.sosy_lab.cpachecker.cpa.automaton.AutomatonParser;
import org.sosy_lab.cpachecker.cpa.formulaslicing.InductiveWeakeningManager;
import org.sosy_lab.cpachecker.cpa.formulaslicing.LoopTransitionFinder;
import org.sosy_lab.cpachecker.cpa.formulaslicing.SemiCNFManager;
import org.sosy_lab.cpachecker.exceptions.CPAException;
import org.sosy_lab.cpachecker.exceptions.CPATransferException;
import org.sosy_lab.cpachecker.util.LoopStructure.Loop;
import org.sosy_lab.cpachecker.util.Pair;
import org.sosy_lab.cpachecker.util.Triple;
import org.sosy_lab.cpachecker.util.predicates.AbstractionManager;
import org.sosy_lab.cpachecker.util.predicates.interpolation.InterpolationManager;
import org.sosy_lab.cpachecker.util.predicates.pathformula.PathFormula;
import org.sosy_lab.cpachecker.util.predicates.pathformula.PathFormulaManager;
import org.sosy_lab.cpachecker.util.predicates.pathformula.SSAMap;
import org.sosy_lab.cpachecker.util.predicates.pathformula.pointeraliasing.PointerTargetSet;
import org.sosy_lab.cpachecker.util.predicates.regions.Region;
import org.sosy_lab.cpachecker.util.predicates.regions.RegionCreator;
import org.sosy_lab.cpachecker.util.predicates.smt.FormulaManagerView;
import org.sosy_lab.cpachecker.util.predicates.smt.Solver;
import org.sosy_lab.cpachecker.util.refinement.InfeasiblePrefix;
import org.sosy_lab.cpachecker.util.refinement.PrefixProvider;
import org.sosy_lab.cpachecker.util.resources.ResourceLimit;
import org.sosy_lab.cpachecker.util.resources.ResourceLimitChecker;
import org.sosy_lab.cpachecker.util.resources.WalltimeLimit;
import org.sosy_lab.solver.SolverException;
import org.sosy_lab.solver.api.BooleanFormula;
import org.sosy_lab.solver.api.BooleanFormulaManager;
import org.sosy_lab.solver.visitors.DefaultBooleanFormulaVisitor;

import com.google.common.base.Function;
import com.google.common.base.Optional;
import com.google.common.base.Predicate;
import com.google.common.collect.FluentIterable;
import com.google.common.collect.Lists;
import com.google.common.io.CharSink;
import com.google.common.io.FileWriteMode;

@Options(prefix = "predicate.invariants")
class InvariantsManager {

  static enum InvariantGenerationStrategy {
    /**
     * Applies inductive weakening on the pathformula (which is converted to a CNF like form)
     * to filter out the invariant part.
     */
    PF_INDUCTIVE_WEAKENING,

    /**
     * Converts the pathformula to a CNF like form and checks the conjuncts on
     * invariants with k-Induction.
     */
    PF_CNF_KIND,

    /**
     * Creates interpolants for a given error path and checks them on invariance
     * with k-Induction.
     */
    RF_INTERPOLANT_KIND,

    /**
     * Runs an additional analysis restricted to the given error path and takes
     * the invariants generated by it.
     */
    RF_INVARIANT_GENERATION,
  }

  static enum InvariantUsageStrategy {

    /**
     * Generated invariants should only be used for refining the precision
     * of the analysis.
     */
    REFINEMENT,

    /**
     * Generated invariants should only be used for directly adding them
     * to the abstraction Formula during precision adjustment.
     */
    ABSTRACTION_FORMULA,

    /**
     * Generated invariants should be used for both, refinement and precision
     * adjustment.
     */
    COMBINATION,

    /**
     * No invariants should be used.
     */
    NONE;
  }

  @Option(
    secure = true,
    description =
        "Timelimit for invariant generation which may be"
            + " used during refinement.\n"
            + "(Use seconds or specify a unit; 0 for infinite)"
  )
  @TimeSpanOption(codeUnit = TimeUnit.NANOSECONDS, defaultUserUnit = TimeUnit.SECONDS, min = 0)
  private TimeSpan timeForInvariantGeneration = TimeSpan.ofNanos(0);

  @Option(
    secure = true,
    description =
        "Invariants that are not strong enough to"
            + " refute the counterexample can be ignored with this option."
            + " (Weak invariants will lead to repeated counterexamples, thus taking"
            + " time which could be used for the rest of the analysis, however, the"
            + " found invariants may also be better for loops as interpolation.)"
  )
  private boolean useStrongInvariantsOnly = true;

  @Option(
    secure = true,
    description = "Should the automata used for invariant" + " generation be dumped to files?"
  )
  private boolean dumpInvariantGenerationAutomata = false;

  @Option(
    secure = true,
    description =
        "Where to dump the automata that are used to narrow the"
            + " analysis used for invariant generation."
  )
  @FileOption(FileOption.Type.OUTPUT_FILE)
  private PathCounterTemplate dumpInvariantGenerationAutomataFile =
      PathCounterTemplate.ofFormatString("invgen.%d.spc");

  @Option(
    secure = true,
    description =
        "How often should generating invariants from"
            + " sliced prefixes with k-induction be tried?"
  )
  private int kInductionTries = 3;

  private final Solver solver;
  private final AbstractionManager amgr;
  private final RegionCreator rmgr;
  private final FormulaManagerView fmgr;
  private final BooleanFormulaManager bfmgr;
  private final PathFormulaManager pfmgr;
  private final InterpolationManager imgr;

  private final InductiveWeakeningManager inductiveWeakeningMgr;
  private final LoopTransitionFinder loopFinder;
  private final SemiCNFManager semiCNFConverter;
  private final CFA cfa;
  private final PrefixProvider prefixProvider;

  private final Configuration config;
  private final LogManager logger;
  private final ShutdownNotifier shutdownNotifier;

  private final Map<CFANode, BooleanFormula> loopFormulaCache = new HashMap<>();
  private final Map<CFANode, Region> regionInvariantsCache = new HashMap<>();
  private final List<BooleanFormula> refinementCache = new ArrayList<>();

  private InvariantUsageStrategy usageStrategy;
  private InvariantGenerationStrategy generationStrategy;

  @SuppressWarnings("options")
  public InvariantsManager(PredicateCPA pPredicateCPA) throws InvalidConfigurationException {
    config = pPredicateCPA.getConfiguration();
    config.inject(this);

    logger = pPredicateCPA.getLogger();
    shutdownNotifier = pPredicateCPA.getShutdownNotifier();

    solver = pPredicateCPA.getSolver();
    amgr = pPredicateCPA.getAbstractionManager();
    rmgr = amgr.getRegionCreator();
    fmgr = solver.getFormulaManager();
    bfmgr = fmgr.getBooleanFormulaManager();
    pfmgr = pPredicateCPA.getPathFormulaManager();
    semiCNFConverter = new SemiCNFManager(fmgr, config);
    cfa = pPredicateCPA.getCfa();

    imgr =
        new InterpolationManager(
            pfmgr,
            solver,
            cfa.getLoopStructure(),
            cfa.getVarClassification(),
            config,
            shutdownNotifier,
            logger);

    prefixProvider = pPredicateCPA.getPrefixProvider();
    inductiveWeakeningMgr = new InductiveWeakeningManager(config, fmgr, solver, logger);
    loopFinder =
        new LoopTransitionFinder(
            config, cfa.getLoopStructure().get(), pfmgr, fmgr, logger, shutdownNotifier);
  }

  RegionInvariantsSupplier asRegionInvariantsSupplier() {
    return new RegionInvariantsSupplier(this);
  }

  /**
   * This method returns the invariants computed for the given locations in
   * {@link #findInvariants(InvariantUsageStrategy, InvariantGenerationStrategy, List, Triple)}
   * in the given order.
   */
  public List<BooleanFormula> getInvariantsForRefinement() {
    return Collections.unmodifiableList(refinementCache);
  }

  public boolean findInvariants(
      InvariantUsageStrategy pUsage,
      InvariantGenerationStrategy pGeneration,
      @Nullable List<Pair<PathFormula, CFANode>> pArgForPathFormulaBasedGeneration,
      @Nullable Triple<ARGPath, List<ARGState>, Set<Loop>> pArgForErrorPathBasedGeneration) {

    // set usage strategy so other methods which are called subsequently can use it
    usageStrategy = pUsage;
    generationStrategy = pGeneration;

    // clear refinementCache
    refinementCache.clear();

    try {
      switch (pGeneration) {
        case PF_CNF_KIND:
          for (Pair<PathFormula, CFANode> pair : pArgForPathFormulaBasedGeneration) {
            findInvariantPartOfPathFormulaWithKInduction(pair.getSecond(), pair.getFirst());
          }
          break;
        case PF_INDUCTIVE_WEAKENING:
          for (Pair<PathFormula, CFANode> pair : pArgForPathFormulaBasedGeneration) {
            findInvariantPartOfPathFormulaWithWeakening(pair.getSecond(), pair.getFirst());
          }
          break;
        case RF_INTERPOLANT_KIND:
          findInvariantInterpolants(
              pArgForErrorPathBasedGeneration.getFirst(),
              pArgForErrorPathBasedGeneration.getSecond());
          break;
        case RF_INVARIANT_GENERATION:
          findInvariantsWithGenerator(
              pArgForErrorPathBasedGeneration.getFirst(),
              pArgForErrorPathBasedGeneration.getSecond(),
              pArgForErrorPathBasedGeneration.getThird());
          break;
        default:
          throw new AssertionError("Unhandled case statement");
      }
    } catch (
        CPAException | SolverException | InterruptedException | InvalidConfigurationException
                | IOException
            e) {
      logger.logUserException(Level.INFO, e, "Invariants could not be computed");
      return false;
    }

    // we most likely have added some invariants and therefore reorder the BDD
    if (usageStrategy != REFINEMENT) {
      amgr.reorderPredicates();
    }

    return true;
  }

  private void addResultToCache(BooleanFormula pInvariant, CFANode pLocation) {

    // add to this cache for combination and for Abstraction Formula
    if (usageStrategy != REFINEMENT) {
      Region invariantRegion = amgr.makePredicate(checkNotNull(pInvariant)).getAbstractVariable();
      if (regionInvariantsCache.containsKey(pLocation)) {
        invariantRegion = rmgr.makeAnd(regionInvariantsCache.get(pLocation), invariantRegion);
      }
      regionInvariantsCache.put(pLocation, invariantRegion);
    }

    // add to this cache for combination and for refinement
    if (usageStrategy != ABSTRACTION_FORMULA) {
      // currently we do not support invariant refinement with these two strategies
      assert generationStrategy != InvariantGenerationStrategy.PF_CNF_KIND
          && generationStrategy != InvariantGenerationStrategy.PF_INDUCTIVE_WEAKENING;
      refinementCache.add(checkNotNull(pInvariant));
    }
  }

  /**
   * This method finds the invariant part of a pathformula and creates a region
   * out of it.
   *
   * @param pBlockFormula A path formula that determines which variables and predicates are relevant.
   * @param pLocation the node of the current loop head
   *
   * @throws CPATransferException may be thrown during loop transition creation
   */
  private void findInvariantPartOfPathFormulaWithWeakening(
      final CFANode pLocation, final PathFormula pBlockFormula)
      throws SolverException, InterruptedException, CPATransferException {

    PointerTargetSet pts = pBlockFormula.getPointerTargetSet();
    SSAMap ssa = pBlockFormula.getSsa();
    PathFormula loopFormula;

    // we already found this loop and just need to update the SSA indices
    if (loopFormulaCache.containsKey(pLocation)) {
      loopFormula =
          new PathFormula(
              fmgr.instantiate(loopFormulaCache.get(pLocation), ssa),
              ssa,
              pts,
              0); // TODO is 0 correct here?
    } else {
      loopFormula = loopFinder.generateLoopTransition(ssa, pts, pLocation);
      loopFormulaCache.put(pLocation, fmgr.uninstantiate(loopFormula.getFormula()));
    }

    BooleanFormula invariant =
        inductiveWeakeningMgr.findInductiveWeakening(
            pBlockFormula.updateFormula(semiCNFConverter.convert(pBlockFormula.getFormula())),
            loopFormula,
            bfmgr.makeBoolean(true));

    addResultToCache(invariant, pLocation);
  }

  private void findInvariantPartOfPathFormulaWithKInduction(
      final CFANode pLocation, PathFormula pPathFormula)
      throws InterruptedException, CPAException, InvalidConfigurationException {

    BooleanFormula cnfFormula = semiCNFConverter.convert(pPathFormula.getFormula());
    Collection<BooleanFormula> conjuncts =
        bfmgr.visit(
            new DefaultBooleanFormulaVisitor<List<BooleanFormula>>() {
              @Override
              protected List<BooleanFormula> visitDefault() {
                return Collections.emptyList();
              }

              @Override
              public List<BooleanFormula> visitAnd(List<BooleanFormula> operands) {
                return operands;
              }
            },
            cnfFormula);
    final Map<String, BooleanFormula> formulaToRegion = new HashMap<>();
    StaticCandidateProvider candidateGenerator =
        new StaticCandidateProvider(
            from(conjuncts)
                .transform(
                    new Function<BooleanFormula, CandidateInvariant>() {
                      @Override
                      public CandidateInvariant apply(BooleanFormula pInput) {
                        String dumpedFormula = fmgr.dumpFormula(pInput).toString();
                        formulaToRegion.put(dumpedFormula, pInput);
                        return makeLocationInvariant(pLocation, dumpedFormula);
                      }
                    }));

    new KInductionInvariantChecker(config, shutdownNotifier, logger, cfa, candidateGenerator)
        .checkCandidates();

    Set<CandidateInvariant> invariants = candidateGenerator.getConfirmedCandidates();

    BooleanFormula invariant = bfmgr.makeBoolean(true);
    for (CandidateInvariant candidate : invariants) {
      invariant = bfmgr.and(invariant, formulaToRegion.get(candidate.toString()));
    }

    addResultToCache(invariant, pLocation);
  }

  /**
   * This method generates invariants by using another CPA and extracting invariants
   * out of it.
   */
  private void findInvariantsWithGenerator(
      final ARGPath allStatesTrace,
      final List<ARGState> abstractionStatesTrace,
      final Set<Loop> pLoopsInPath)
      throws IOException, InvalidConfigurationException, CPAException, InterruptedException {

    StringBuilder spc = new StringBuilder();
    ARGUtils.producePathAutomatonWithLoops(
        spc, allStatesTrace.getFirstState(), allStatesTrace.getStateSet(), "invGen", pLoopsInPath);

    if (dumpInvariantGenerationAutomata) {
      Path logPath = dumpInvariantGenerationAutomataFile.getFreshPath();
      CharSink file = logPath.asCharSink(Charset.defaultCharset(), FileWriteMode.APPEND);
      file.openStream().append(spc).close();
    }

    Scope scope =
        cfa.getLanguage() == Language.C ? new CProgramScope(cfa, logger) : DummyScope.getInstance();

    List<Automaton> automata =
        AutomatonParser.parseAutomaton(
            new StringReader(spc.toString()),
            Optional.<Path>absent(),
            config,
            logger,
            cfa.getMachineModel(),
            scope,
            cfa.getLanguage());

    ShutdownManager invariantShutdown = ShutdownManager.createWithParent(shutdownNotifier);
    ResourceLimitChecker limits = null;
    if (!timeForInvariantGeneration.isEmpty()) {
      WalltimeLimit l = WalltimeLimit.fromNowOn(timeForInvariantGeneration);
      limits =
          new ResourceLimitChecker(invariantShutdown, Collections.<ResourceLimit>singletonList(l));
      limits.start();
    }

    InvariantGenerator invGen =
        CPAInvariantGenerator.create(
            config, logger, invariantShutdown, Optional.<ShutdownManager>absent(), cfa, automata);

    generateInvariants0(abstractionStatesTrace, invGen);

    if (!timeForInvariantGeneration.isEmpty()) {
      limits.cancel();
    }
  }

  private void generateInvariants0(
      final List<ARGState> abstractionStatesTrace, InvariantGenerator invGen)
      throws CPAException, InterruptedException {

    invGen.start(cfa.getMainFunction());
    InvariantSupplier invSup = invGen.get();

    // we do only want to use invariants that can be used to make the program safe
    if (!useStrongInvariantsOnly || invGen.isProgramSafe()) {
      List<Pair<BooleanFormula, CFANode>> invariants = new ArrayList<>();
      for (ARGState s : abstractionStatesTrace) {
        // the last one will always be false, we don't need it here
        if (s != abstractionStatesTrace.get(abstractionStatesTrace.size() - 1)) {
          CFANode location = extractLocation(s);
          BooleanFormula invariant = invSup.getInvariantFor(location, fmgr, pfmgr);
          invariants.add(Pair.of(invariant, location));
          logger.log(Level.ALL, "Precision increment for location", location, "is", invariant);
        }
      }

      if (from(invariants)
          .transform(Pair.<BooleanFormula>getProjectionToFirst())
          .allMatch(equalTo(fmgr.getBooleanFormulaManager().makeBoolean(true)))) {
        logger.log(Level.INFO, "All invariants were TRUE, ignoring result.");

      } else {
        // iterate over the trace another time and add the result to the
        // appropriate caches (we do not do this above, as it could be that every
        // found invariant is true, this is not helpful and therefore omitted)
        for (Pair<BooleanFormula, CFANode> pair : invariants) {
          addResultToCache(pair.getFirst(), pair.getSecond());
        }
      }

    } else {
      logger.log(
          Level.INFO,
          "Invariants found, but they are not strong enough to refute the counterexample");
    }
  }

  private void findInvariantInterpolants(ARGPath pPath, List<ARGState> pAbstractionStatesTrace)
      throws CPAException, InterruptedException, InvalidConfigurationException {
    InvCandidateGenerator candidateGenerator =
        new InvCandidateGenerator(pPath, pAbstractionStatesTrace);

    KInductionInvariantChecker invChecker =
        new KInductionInvariantChecker(config, shutdownNotifier, logger, cfa, candidateGenerator);
    invChecker.checkCandidates();

    if (candidateGenerator.hasFoundInvariants()) {
      List<Pair<BooleanFormula, CFANode>> invariants =
          candidateGenerator.retrieveConfirmedInvariants();
      // if we found invariants at least one of them may not be "TRUE"
      if (from(invariants)
          .transform(Pair.<BooleanFormula>getProjectionToFirst())
          .allMatch(equalTo(fmgr.getBooleanFormulaManager().makeBoolean(true)))) {
        logger.log(Level.INFO, "All invariants were TRUE, ignoring result.");
      } else {
        for (Pair<BooleanFormula, CFANode> invariant : invariants) {
          addResultToCache(invariant.getFirst(), invariant.getSecond());
        }
      }

    } else {
      logger.log(Level.INFO, "No invariants were found.");
    }
  }

  private class InvCandidateGenerator implements CandidateGenerator {

    private int trieNum = 0;
    private List<CandidateInvariant> candidates = new ArrayList<>();

    private final ARGPath argPath;
    private final List<CFANode> abstractionNodes;
    private final Set<ARGState> elementsOnPath;
    private final List<ARGState> abstractionStatesTrace;
    private final List<InfeasiblePrefix> infeasiblePrefixes;
    private final List<AbstractLocationFormulaInvariant> foundInvariants = new ArrayList<>();

    private InvCandidateGenerator(ARGPath pPath, List<ARGState> pAbstractionStatesTrace)
        throws CPAException, InterruptedException {
      argPath = pPath;
      abstractionNodes = from(pAbstractionStatesTrace).transform(EXTRACT_LOCATION).toList();
      elementsOnPath = getAllStatesOnPathsTo(argPath.getLastState());
      abstractionStatesTrace = pAbstractionStatesTrace;

      infeasiblePrefixes = prefixProvider.extractInfeasiblePrefixes(argPath);
    }

    @Override
    public boolean produceMoreCandidates() {
      if (trieNum >= kInductionTries) {
        return false;
      }

      if (infeasiblePrefixes.isEmpty()) {
        logger.log(Level.WARNING, "Could not create infeasible prefixes for invariant generation.");
        return false;
      }

      candidates =
          newArrayList(concat(from(infeasiblePrefixes).transform(TO_LOCATION_CANDIDATE_INVARIANT)));
      trieNum++;

      return true;
    }

    private final Function<InfeasiblePrefix, List<CandidateInvariant>>
        TO_LOCATION_CANDIDATE_INVARIANT =
            new Function<InfeasiblePrefix, List<CandidateInvariant>>() {
              @Override
              public List<CandidateInvariant> apply(InfeasiblePrefix pInput) {
                List<BooleanFormula> interpolants;
                try {
                  List<BooleanFormula> pathFormula = pInput.getPathFormulae();
                  // the prefix is not filled up with trues if it is shorter than
                  // the path so we need to do it ourselves
                  while (pathFormula.size() < abstractionStatesTrace.size()) {
                    pathFormula.add(bfmgr.makeBoolean(true));
                  }
                  interpolants =
                      imgr.buildCounterexampleTrace(
                              pInput.getPathFormulae(),
                              Lists.<AbstractState>newArrayList(abstractionStatesTrace),
                              elementsOnPath,
                              true)
                          .getInterpolants();

                } catch (CPAException | InterruptedException e) {
                  logger.logUserException(
                      Level.WARNING, e, "Could not compute interpolants for k-induction inv-gen");
                  return Collections.emptyList();
                }

                List<CandidateInvariant> invCandidates = new ArrayList<>();
                // add false as last interpolant for the error location
                interpolants = new ArrayList<>(interpolants);
                interpolants.add(bfmgr.makeBoolean(false));

                for (Pair<CFANode, BooleanFormula> nodeAndFormula :
                    Pair.<CFANode, BooleanFormula>zipList(abstractionNodes, interpolants)) {
                  invCandidates.add(
                      makeLocationInvariant(
                          nodeAndFormula.getFirst(),
                          solver
                              .getFormulaManager()
                              .dumpFormula(nodeAndFormula.getSecond())
                              .toString()));
                }
                return invCandidates;
              }
            };

    @Override
    public boolean hasCandidatesAvailable() {
      return !candidates.isEmpty();
    }

    @Override
    public void confirmCandidates(Iterable<CandidateInvariant> pCandidates) {
      for (CandidateInvariant inv : pCandidates) {
        candidates.remove(inv);
        foundInvariants.add((AbstractLocationFormulaInvariant) inv);
      }
    }

    @Override
    public Iterator<CandidateInvariant> iterator() {
      if (trieNum == 0) {
        return Collections.<CandidateInvariant>emptyIterator();
      }
      return candidates.iterator();
    }

    public boolean hasFoundInvariants() {
      return !foundInvariants.isEmpty();
    }

    @Override
    public Set<AbstractLocationFormulaInvariant> getConfirmedCandidates() {
      return new HashSet<>(foundInvariants);
    }

    public List<Pair<BooleanFormula, CFANode>> retrieveConfirmedInvariants() {
      FluentIterable<AbstractLocationFormulaInvariant> found = from(foundInvariants);
      List<Pair<BooleanFormula, CFANode>> invariants = new ArrayList<>();
      for (final CFANode node : abstractionNodes) {
        // we don't want the last node to be here, as the invariant will always
        // be FALSE
        if (node.equals(abstractionNodes.get(abstractionNodes.size() - 1))) {
          continue;
        }
        invariants.add(
            Pair.of(
                found
                    .filter(
                        new Predicate<AbstractLocationFormulaInvariant>() {
                          @Override
                          public boolean apply(AbstractLocationFormulaInvariant pInput) {
                            return getOnlyElement(pInput.getLocations()).equals(node);
                          }
                        })
                    .first()
                    .transform(
                        new Function<AbstractLocationFormulaInvariant, BooleanFormula>() {
                          @Override
                          public BooleanFormula apply(AbstractLocationFormulaInvariant pInput) {
                            try {
                              return pInput.getFormula(fmgr, pfmgr);
                            } catch (CPATransferException | InterruptedException e) {
                              // this should never happen, if it does we log
                              // the exception and return TRUE as invariant
                              logger.logUserException(
                                  Level.WARNING,
                                  e,
                                  "Invariant could not be" + " retrieved from InvariantGenerator");
                              return fmgr.getBooleanFormulaManager().makeBoolean(true);
                            }
                          }
                        })
                    .or(fmgr.getBooleanFormulaManager().makeBoolean(true)),
                node));
      }

      return invariants;
    }
  }

  static class RegionInvariantsSupplier {

    private final InvariantsManager invariants;

    public RegionInvariantsSupplier(InvariantsManager pInvariants) {
      invariants = pInvariants;
    }

    public Region getInvariantFor(CFANode location) {
      return invariants.regionInvariantsCache.get(location);
    }

    public boolean hasInvariantFor(CFANode location) {
      return invariants.regionInvariantsCache.containsKey(location);
    }
  }
}
/*
 *  CPAchecker is a tool for configurable software verification.
 *  This file is part of CPAchecker.
 *
 *  Copyright (C) 2007-2010  Dirk Beyer
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
package org.sosy_lab.cpachecker.fllesh.fql.backend.testgoals;

import java.io.IOException;

import org.junit.Test;

import com.google.common.collect.ImmutableMap;

import org.sosy_lab.common.LogManager;
import org.sosy_lab.common.configuration.Configuration;
import org.sosy_lab.common.configuration.InvalidConfigurationException;

import org.sosy_lab.cpachecker.exceptions.CPAException;
import org.sosy_lab.cpachecker.fllesh.fql.backend.pathmonitor.Automaton;
import org.sosy_lab.cpachecker.fllesh.fql.backend.targetgraph.TargetGraph;
import org.sosy_lab.cpachecker.fllesh.fql.backend.targetgraph.TargetGraphUtil;
import org.sosy_lab.cpachecker.fllesh.fql.frontend.ast.coverage.Edges;
import org.sosy_lab.cpachecker.fllesh.fql.frontend.ast.coverage.Sequence;
import org.sosy_lab.cpachecker.fllesh.fql.frontend.ast.coverage.States;
import org.sosy_lab.cpachecker.fllesh.fql.frontend.ast.pathmonitor.FilterMonitor;
import org.sosy_lab.cpachecker.fllesh.fql.frontend.ast.pathmonitor.LowerBound;
import org.sosy_lab.cpachecker.fllesh.fql.frontend.ast.pathmonitor.PathMonitor;
import org.sosy_lab.cpachecker.fllesh.fql.frontend.ast.query.Query;
import org.sosy_lab.cpachecker.fllesh.fql2.ast.filter.Identity;
import org.sosy_lab.cpachecker.fllesh.util.ModifiedCPAchecker;


public class CoverageSequenceTest {

  private static final String mPropertiesFile = "test/config/simpleMustMayAnalysis.properties";
  private final ImmutableMap<String, String> mProperties =
        ImmutableMap.of("analysis.programNames", "test/programs/simple/functionCall.c");

  @Test
  public void test_01() throws IOException, InvalidConfigurationException, CPAException {
    Configuration lConfiguration = new Configuration(mPropertiesFile, mProperties);

    LogManager lLogManager = new LogManager(lConfiguration);

    ModifiedCPAchecker lCPAchecker = new ModifiedCPAchecker(lConfiguration, lLogManager);

    TargetGraph lTargetGraph = TargetGraphUtil.cfa(lCPAchecker.getMainFunction());

    States lStatesCoverage = new States(Identity.getInstance());

    Query lQuery = new Query(lStatesCoverage, new LowerBound(new FilterMonitor(Identity.getInstance()), 0));

    CoverageSequence lCoverageSequence = CoverageSequence.create(lQuery.getCoverage(), lTargetGraph);

    Automaton lPassingAutomaton = Automaton.create(lQuery.getPassingMonitor(), lTargetGraph);

    System.out.println(lCoverageSequence);
    System.out.println("PASSING AUTOMATON: ");
    System.out.println(lPassingAutomaton);
  }

  @Test
  public void test_02() throws IOException, InvalidConfigurationException, CPAException {
    Configuration lConfiguration = new Configuration(mPropertiesFile, mProperties);

    LogManager lLogManager = new LogManager(lConfiguration);

    ModifiedCPAchecker lCPAchecker = new ModifiedCPAchecker(lConfiguration, lLogManager);

    TargetGraph lTargetGraph = TargetGraphUtil.cfa(lCPAchecker.getMainFunction());

    States lStatesCoverage = new States(Identity.getInstance());

    PathMonitor lTrueMonitor = new LowerBound(new FilterMonitor(Identity.getInstance()), 0);

    Sequence lSequence = new Sequence(lTrueMonitor, lStatesCoverage, lTrueMonitor);

    Query lQuery = new Query(lSequence, lTrueMonitor);

    CoverageSequence lCoverageSequence = CoverageSequence.create(lQuery.getCoverage(), lTargetGraph);

    Automaton lPassingAutomaton = Automaton.create(lQuery.getPassingMonitor(), lTargetGraph);

    System.out.println(lCoverageSequence);
    System.out.print("PASSING AUTOMATON: ");
    System.out.println(lPassingAutomaton);
  }

  @Test
  public void test_03() throws IOException, InvalidConfigurationException, CPAException {
    Configuration lConfiguration = new Configuration(mPropertiesFile, mProperties);

    LogManager lLogManager = new LogManager(lConfiguration);

    ModifiedCPAchecker lCPAchecker = new ModifiedCPAchecker(lConfiguration, lLogManager);

    TargetGraph lTargetGraph = TargetGraphUtil.cfa(lCPAchecker.getMainFunction());

    States lStatesCoverage = new States(Identity.getInstance());

    PathMonitor lTrueMonitor = new LowerBound(new FilterMonitor(Identity.getInstance()), 0);

    Sequence lSequence = new Sequence(lTrueMonitor, lStatesCoverage, lTrueMonitor);

    lSequence.extend(lTrueMonitor, new Edges(Identity.getInstance()));

    Query lQuery = new Query(lSequence, lTrueMonitor);

    CoverageSequence lCoverageSequence = CoverageSequence.create(lQuery.getCoverage(), lTargetGraph);

    Automaton lPassingAutomaton = Automaton.create(lQuery.getPassingMonitor(), lTargetGraph);

    System.out.println(lCoverageSequence);
    System.out.print("PASSING AUTOMATON: ");
    System.out.println(lPassingAutomaton);
  }

}

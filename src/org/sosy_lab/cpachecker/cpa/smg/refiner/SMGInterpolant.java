/*
 *  CPAchecker is a tool for configurable software verification.
 *  This file is part of CPAchecker.
 *
 *  Copyright (C) 2007-2015  Dirk Beyer
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
package org.sosy_lab.cpachecker.cpa.smg.refiner;

import com.google.common.collect.ImmutableSet;

import org.sosy_lab.common.log.LogManager;
import org.sosy_lab.cpachecker.cfa.model.FunctionEntryNode;
import org.sosy_lab.cpachecker.cfa.model.c.CFunctionEntryNode;
import org.sosy_lab.cpachecker.cfa.types.MachineModel;
import org.sosy_lab.cpachecker.cpa.smg.SMGAbstractionBlock;
import org.sosy_lab.cpachecker.cpa.smg.SMGInconsistentException;
import org.sosy_lab.cpachecker.cpa.smg.SMGIntersectStates.SMGIntersectionResult;
import org.sosy_lab.cpachecker.cpa.smg.SMGState;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.logging.Level;


public class SMGInterpolant {

  private static final SMGInterpolant FALSE = new SMGInterpolant();

  private final Set<SMGAbstractionBlock> abstractionBlock;
  private final Set<SMGMemoryPath> trackedMemoryPaths;
  private final Set<SMGState> smgStates;

  private SMGInterpolant() {
    abstractionBlock = ImmutableSet.of();
    trackedMemoryPaths = ImmutableSet.of();
    smgStates = ImmutableSet.of();
  }

  public SMGInterpolant(Set<SMGState> pStates) {
    smgStates = ImmutableSet.copyOf(pStates);
    abstractionBlock = ImmutableSet.of();

    Set<SMGMemoryPath> memoryPaths = new HashSet<>();

    for (SMGState state : smgStates) {
      memoryPaths.addAll(state.getMemoryPaths());
    }

    trackedMemoryPaths = memoryPaths;
  }

  public SMGInterpolant(Set<SMGState> pStates, Set<SMGAbstractionBlock> pAbstractionBlock) {

    smgStates = ImmutableSet.copyOf(pStates);
    abstractionBlock = pAbstractionBlock;

    Set<SMGMemoryPath> memoryPaths = new HashSet<>();

    for (SMGState state : smgStates) {
      memoryPaths.addAll(state.getMemoryPaths());
    }

    trackedMemoryPaths = memoryPaths;
  }

  public List<SMGState> reconstructStates() {

    if (isFalse()) {
      throw new IllegalStateException("Can't reconstruct state from FALSE-interpolant");
    } else {
      List<SMGState> result = new ArrayList<>(this.smgStates.size());
      for (SMGState state : smgStates) {
        result.add(new SMGState(state));
      }

      return result;
    }
  }

  public Set<SMGMemoryPath> getMemoryLocations() {
    return trackedMemoryPaths;
  }

  public boolean isTrue() {
    /* No heap abstraction can be performed without hv-edges, thats
     * why every interpolant without hv-edges is true.
     */
    return !isFalse() && trackedMemoryPaths.isEmpty();
  }

  public boolean isFalse() {
    return this == FALSE;
  }

  public boolean isTrivial() {
    return isTrue() || isFalse();
  }

  public SMGInterpolant join(SMGInterpolant pOtherInterpolant) {
    if (isFalse() || pOtherInterpolant.isFalse()) {
      return SMGInterpolant.FALSE;
    }

    Set<SMGState> joinResult = new HashSet<>();
    Set<SMGState> originalStatesNotJoint = new HashSet<>(smgStates);

    for (SMGState otherState : pOtherInterpolant.smgStates) {

      SMGIntersectionResult result = SMGIntersectionResult.getNotDefinedInstance();

      for (SMGState state : originalStatesNotJoint) {
        result = state.intersectStates(otherState);

        if(result.isDefined()) {
          break;
        }
      }

      if (result.isDefined()) {
        originalStatesNotJoint.remove(result.getSmg1());
        joinResult.add(result.getCombinationResult());
      } else {
        joinResult.add(otherState);
      }
    }

    joinResult.addAll(originalStatesNotJoint);

    Set<SMGAbstractionBlock> jointAbstractionBlock = new HashSet<>(abstractionBlock);
    jointAbstractionBlock.addAll(pOtherInterpolant.abstractionBlock);
    return new SMGInterpolant(joinResult, jointAbstractionBlock);
  }

  public static SMGInterpolant createInitial(LogManager logger, MachineModel model,
      FunctionEntryNode pMainFunctionNode, boolean pTrackPredicates, int pExternalAllocationSize) {
    SMGState initState = new SMGState(logger, model, false, false,
        null, pExternalAllocationSize, pTrackPredicates, false);

    CFunctionEntryNode functionNode = (CFunctionEntryNode) pMainFunctionNode;
    try {
      initState.addStackFrame(functionNode.getFunctionDefinition());
    } catch (SMGInconsistentException exc) {
      logger.log(Level.SEVERE, exc.getMessage());
    }

    return new SMGInterpolant(ImmutableSet.of(initState));
  }

  public static SMGInterpolant getFalseInterpolant() {
    return FALSE;
  }

  @Override
  public String toString() {

    if (isFalse()) {
      return "FALSE";
    } else {
      return "Tracked memory paths: " + trackedMemoryPaths.toString() + "\nAbstraction locks: "
          + abstractionBlock.toString();
    }
  }

  public static SMGInterpolant getTrueInterpolant(SMGInterpolant template) {

    if (template.isFalse()) {
      throw new IllegalArgumentException(
        "Can't create true interpolant from a false interpolant template.");
    }

    SMGState templateState = template.smgStates.iterator().next();

    SMGState newState = new SMGState(templateState);

    newState.clearValues();

    return new SMGInterpolant(ImmutableSet.of(newState));
  }

  public SMGPrecisionIncrement getPrecisionIncrement() {
    List<SMGMemoryPath> memoryPaths = new ArrayList<>(trackedMemoryPaths.size());
    memoryPaths.addAll(trackedMemoryPaths);
    List<SMGAbstractionBlock> blocks = new ArrayList<>(abstractionBlock.size());
    blocks.addAll(abstractionBlock);

    return new SMGPrecisionIncrement(memoryPaths, blocks);
  }

  public static class SMGPrecisionIncrement implements Comparable<SMGPrecisionIncrement> {

    private final List<SMGMemoryPath> pathsToTrack;
    private final List<SMGAbstractionBlock> abstractionBlock;

    public SMGPrecisionIncrement(List<SMGMemoryPath> pPathsToTrack,
        List<SMGAbstractionBlock> pAbstractionBlock) {
      pathsToTrack = pPathsToTrack;
      abstractionBlock = pAbstractionBlock;
    }

    @Override
    public String toString() {
      return "SMGPrecisionIncrement [pathsToTrack=" + pathsToTrack + ", abstractionBlock="
          + abstractionBlock + "]";
    }

    @Override
    public int hashCode() {
      final int prime = 31;
      int result = 1;
      result = prime * result + ((abstractionBlock == null) ? 0 : abstractionBlock.hashCode());
      result = prime * result + ((pathsToTrack == null) ? 0 : pathsToTrack.hashCode());
      return result;
    }

    @Override
    public boolean equals(Object obj) {
      if (this == obj) {
        return true;
      }
      if (obj == null) {
        return false;
      }
      if (getClass() != obj.getClass()) {
        return false;
      }
      SMGPrecisionIncrement other = (SMGPrecisionIncrement) obj;
      if (abstractionBlock == null) {
        if (other.abstractionBlock != null) {
          return false;
        }
      } else if (!abstractionBlock.equals(other.abstractionBlock)) {
        return false;
      }
      if (pathsToTrack == null) {
        if (other.pathsToTrack != null) {
          return false;
        }
      } else if (!pathsToTrack.equals(other.pathsToTrack)) {
        return false;
      }
      return true;
    }

    public Collection<SMGMemoryPath> getPathsToTrack() {
      return pathsToTrack;
    }

    public Collection<SMGAbstractionBlock> getAbstractionBlock() {
      return abstractionBlock;
    }

    @Override
    public int compareTo(SMGPrecisionIncrement other) {

      for (int i = 0; i < pathsToTrack.size(); i++) {
        SMGMemoryPath path = pathsToTrack.get(i);
        SMGMemoryPath otherPath = other.pathsToTrack.get(i);

        int result = path.compareTo(otherPath);

        if (result != 0) {
          return result;
        }
      }

      for (int i = 0; i < abstractionBlock.size(); i++) {
        SMGAbstractionBlock offset = abstractionBlock.get(i);
        SMGAbstractionBlock otherOffset = other.abstractionBlock.get(i);

        int result = offset.compareTo(otherOffset);

        if (result != 0) {
          return result;
        }
      }

      return 0;
    }
  }
}
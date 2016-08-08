/*
 * CPAchecker is a tool for configurable software verification.
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
package org.sosy_lab.cpachecker.util.holder;

import java.util.Objects;

/**
 * A HolderLong holds a value of type long. This class is meant as a workaround for inner
 * classes and lambdas which require the variables they use from the outer block to be final or
 * effectively final.
 */
public final class HolderLong {

  /**
   * Use this as you would use a local variable
   */
  public long value;

  private HolderLong(long pValue) {
    value = pValue;
  }

  /**
   * Creates a new HolderLong
   *
   * @param value the initial value to hold
   * @return the new HolderLong
   */
  public static HolderLong of(long value) {
    return new HolderLong(value);
  }

  @Override
  public String toString() {
    return String.valueOf(value);
  }

  @Override
  public boolean equals(Object pO) {
    if (this == pO) {
      return true;
    }
    if (pO == null || getClass() != pO.getClass()) {
      return false;
    }
    HolderLong holder = (HolderLong) pO;
    return Objects.equals(value, holder.value);
  }

  @Override
  public int hashCode() {
    return Objects.hash(value);
  }
}
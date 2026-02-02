#!/bin/bash
# Test runner script - executes Jest from the tests directory

cd "$(dirname "$0")/../tests" || exit 1
npm test "$@"

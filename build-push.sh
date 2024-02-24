#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail

if [ -n "$(git status --porcelain)" ]; then
  echo "Please ensure there are no changes or untracked files before rebuilding"
  exit 1
fi

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
source ${SCRIPT_DIR}/vars.sh

for project in $PROJECTS; do
  docker build ${SCRIPT_DIR}/${project} -f ${SCRIPT_DIR}/${project}/Dockerfile \
    -t ${REGISTRY_NAME}/${REPO}/${project}:${GIT_TAG}
  docker push ${REGISTRY_NAME}/${REPO}/${project}:${GIT_TAG}
done;

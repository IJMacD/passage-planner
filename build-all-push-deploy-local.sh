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

[[ ! -z $(k3d cluster list ${APPNAME} | grep '0/1') ]] && k3d cluster stop --all && k3d cluster start ${APPNAME}

# Override
export KUBECONFIG=$LOCAL_KUBECONFIG

kubectl config use-context k3d-${APPNAME}

for project in $PROJECTS; do
  docker build ${SCRIPT_DIR}/${project} -f ${SCRIPT_DIR}/${project}/Dockerfile \
    -t ${REGISTRY_NAME}/${REPO}/${project}:${GIT_TAG} -t ${LOCAL_REGISTRY}/${REPO}/${project}:${GIT_TAG}
  docker push ${LOCAL_REGISTRY}/${REPO}/${project}:${GIT_TAG}
done;

# helm dependency build --skip-refresh $SCRIPT_DIR/kube/chart/${APPNAME}/


helm upgrade --install ${APPNAME} \
  $SCRIPT_DIR/kube/chart/${APPNAME}/ \
  --namespace ${APPNAME} --create-namespace \
  -f ${SCRIPT_DIR}/kube/chart/${APPNAME}/overrides.dev.yaml \
  --set appVersion=$GIT_TAG \
  $@
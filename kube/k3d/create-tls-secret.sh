#! /bin/bash

set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
source ${SCRIPT_DIR}/../../vars.sh

echo '---'
# Check if the namespace exists
if ! kubectl get namespace "${APPNAME}" > /dev/null 2>&1; then
    echo "Namespace ${APPNAME} does not exist, creating it..."
    kubectl create namespace "${APPNAME}"
else
    echo "Namespace ${APPNAME} already exists, skipping creation."
fi

export LOCALHOST_NAME=${APPNAME}.localhost
export TLS_SECRET_NAME=${APPNAME}-cert


echo '---'
kubectl -n ${APPNAME} delete secret ${TLS_SECRET_NAME} --ignore-not-found

echo '---'
mkcert -install
mkcert -cert-file ${SCRIPT_DIR}/local-secrets/${LOCALHOST_NAME}.pem -key-file ${SCRIPT_DIR}/local-secrets/${LOCALHOST_NAME}-key.pem ${LOCALHOST_NAME}
kubectl -n ${APPNAME} create secret tls ${TLS_SECRET_NAME} --key ${SCRIPT_DIR}/local-secrets/${LOCALHOST_NAME}-key.pem --cert ${SCRIPT_DIR}/local-secrets/${LOCALHOST_NAME}.pem
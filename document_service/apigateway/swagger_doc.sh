#!/bin/bash

# Generate Swagger File Documentation
serverless downloadDocumentation --outputFileName=$1
mv $1 swagger_yaml

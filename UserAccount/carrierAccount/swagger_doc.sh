#!/bin/bash

# Generate Swagger File Documentation
serverless downloadDocumentation --outputFileName=carrier.ext
mv carrier.ext swagger_yaml

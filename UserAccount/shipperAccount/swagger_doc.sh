#!/bin/bash

# Generate Swagger File Documentation
serverless downloadDocumentation --outputFileName=shipper.ext
mv shipper.ext swagger_yaml

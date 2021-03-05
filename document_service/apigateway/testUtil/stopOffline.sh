#!/bin/bash
kill `cat .offline.pid`
rm .offline.pid
rm 1 
rm s3local/documents-service-storage/*

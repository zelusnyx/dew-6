# DEW (Doer!): Distributed Eperiment Workflows Representation
# Generators

This directory contains code that takes in DEW's HLB language and
constraints, and  generates various orchestration and skeleton
scripts that can be used as a starting point to run/tune/orchestrate your
experiment.

# Running Generators

For now, the generators framework is developed and tested under Python 3.x.
Porting to 2.x has not been done.

To run a generator:

%  python3 run_generator.py -o {OUTDIR} INFILE {GENERATOR}

## INFILE

The INFILE is a required argument.  The input file (INFILE in the command
above) contains the HLB statements and associated constraints for your
experiment.  See the "example.hlb" file in this directory for an example.

The file has 2 sections, marked with:
	[HLB]
and
	[Constraints]

As the section headings suggest, under [HLB] there should be HLB statements,
and under [Constraints], place any associated DEW constraints (e.g. "os
nodeA ubuntu").

## GENERATOR

By default, the generator used is "bash", meaning the output produced will
be bash scripts.

Also generator will produce NS file("nsFile.txt") from the input DEW constraints.
E.g., python3 run_generator.py DEW_Example.txt

For a generator to be loaded, there needs to be a python module within this
directory of the form of:
	GENERATOR/GENERATOR.py

For example, there is a bash/bash.py module.

This module MUST contain the class "Generator" which must inheret from
"GeneralGenerator". 

The GeneralGenerator superclass is defined in generator.py within this
directory and contains the common functions for all HLB->XXX generators,
such as determining the HLB statement dependencies and parsing constraints
and HLB. See the comments in generator.py for more details.

## OUTDIR

The outdir is the directory where the generated scripts will be written. If
this directory does not exist, run_generator.py will attempt to create this
directory. By default, scripts are generated in /tmp.

# Organization of this directory

* README.md 	- this file
* example.hlb 	- example of HLB+Constraints input file for generators
* generator.py 	- superclass for generators which handles commmon functions and generate NS file
* XXX/XXX.py	- generator directory format, e.g. bash/bash.py




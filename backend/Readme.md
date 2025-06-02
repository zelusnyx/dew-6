# DEW - Backend

## Serve
``` python
cd backend
python app.py
```

### Parser API

Take an input string (behavior) and return the actors, triggers, actions, emit events and wait times. This can be used for auto completing the actors list.

#### Request
| Name | Value |
| --- | --- |
| Path | `/hlb/v1/parse` |
| Verb | PUT |
| Body/Parameters | JSON: `{Scenario, Constraints, ParseType}` |

#### Response
| Name | Value |
| --- | --- |
| Status | `200` |
| Body | JSON: `{_id, parsedScenario : tuple((TODO: actors), trigger events, actions, emit events, wait time), parsedConstraints: tuple(constraint type, target, value)}`|

#### Sample
``` bash
#Sample API:
http://localhost:5000/hlb/v1/parse

#Sample json body:
{
    "Scenario": ["thing1 runAThing emit trigger1", "when trigger1 thing2 runAnotherThing"],
    "Constraints": ["num thing1 3", "num thing2 2", "num thing3 3", "os thing2 anOStype", "lan thing1 thing2 thing3", "link thing1 thing2"],
    "ParseType": "bash"
}

#Sample Output:
#parsedScenario -> ['trigger events', 'actors', 'action', 'emit events', 'wait time']
#parsedConstraints -> ['constraint type', 'target', 'value' ] (some of these can be None)
{
    "_id": "1",
    "parsedScenario": [(None, ['thing1'], ['runathing'], ['trigger1'], None), (['trigger1'], ['thing2'], ['runanotherthing'], None, None)],
    "parsedConstraints": [('num', ['thing1'], ['3']), ('num', ['thing2'], ['2']), ('num', ['thing3'], ['3']), ('os', ['thing2'], ['anOStype']), ('lan', ['thing1', 'thing2', 'thing3'], None), ('link', ['thing1', 'thing2'], None)]
}
```

### generateNS API

This API takes the behavior, constraints and actors and return a NS file which can be used in deterlab.

#### Request
| Name | Value |
| --- | --- |
| Path | `/hlb/v1/generateNs` |
| Verb | PUT |
| Body | JSON: `{Actors, Scenario, Constraints, Bindings}` |

#### Response
| Name | Value |
| --- | --- |
| Status | `200` |
| Body | DEW contents as a return File, `returnGenerate.ns` |

#### Sample
``` bash
#Sample API:
http://localhost:5000/hlb/v1/generateNs

#Sample json body
{
    "Actors": [
        "actor0", 
        "actor1", 
        "actor2"
    ],
    "Scenario": [
        "actor0 nohup emit nohup_done",
        "actor1 nohup_2 emit nohup_2_done",
        "actor2 nohup_3 emit nohup_3_done"
    ],
    "Constraints": [],
    "Bindings": [
        "nohup cd senss; nohup perl random.pl nosig 1 5 > random.nosig.correct.0 &",
        "nohup_2 cd senss; nohup perl random.pl nosig 10 5 > random.nosig.correct.1 &"
    ]
}

#Sample Output
#returnGenerate.ns

    set ns [new Simulator]
    source tb_compat.tcl
    # Nodes
    foreach node {
        actor0
        actor1
        actor2
    } {
        set $node [$ns node]
        tb-set-node-os $node Ubuntu-STD
    }
    set lan0 [$ns make-lan "$actor0 $actor1 $actor2 " 100000.0kb 0.0ms]
    
    $ns rtproto Static
    $ns run

```

### Translator API

Takes a file as an input and returns the dew format

#### Request
| Name | Value |
| --- | --- |
| Path | `/hlb/v1/translate/:format/:returnType`,  `format` can be bash, magi, go etc., `returnType` can be dew & json |
| Verb | PUT |
| Body | Script File(e.g. `runall.sh`), which needs to be converted to DEW |

#### Response
| Name | Value |
| --- | --- |
| Status | `200` |
| Body(returnType: `json`) | JSON: `{InputFileContent}`, contents as a json |
| Body(returnType: `dew`) | Dew contents as a return file, (e.g. `runall.dew`) |

#### Sample
``` bash
#Sample API:
http://localhost:5000/hlb/v1/translate/<string:format>/<string:returnType>

#Sample script file
# runall.sh
    ssh node-0.large.senss "cd senss; nohup perl random.pl nosig 1 5 > random.nosig.correct.0 &"
    ssh node-1.large.senss "cd senss; nohup perl random.pl nosig 10 5 > random.nosig.correct.1 &"
    ssh node-2.large.senss "cd senss; nohup perl random.pl nosig 100 5 > random.nosig.correct.2 &"
    ssh node-3.large.senss "cd senss; nohup perl random.pl nosig 1000 5 > random.nosig.correct.3 &"
    ssh node-4.large.senss "cd senss; nohup perl top.pl nosig 1 5 > top.nosig.correct.0 &"
    ssh node-5.large.senss "cd senss; nohup perl top.pl nosig 10 5 > top.nosig.correct.1 &"
    ssh node-6.large.senss "cd senss; nohup perl top.pl nosig 100 5 > top.nosig.correct.2 &"
    ssh node-7.large.senss "cd senss; nohup perl top.pl nosig 1000 5 > top.nosig.correct.3 &"

#Sample Output, with returnType: `dew`
# runall.dew

    [Scenario]
    actor0 nohup emit nohup_done
    actor1 nohup_2 emit nohup_2_done
    actor2 nohup_3 emit nohup_3_done
    actor3 nohup_4 emit nohup_4_done
    actor4 nohup_5 emit nohup_5_done
    actor5 nohup_6 emit nohup_6_done
    actor6 nohup_7 emit nohup_7_done
    actor7 nohup_8 emit nohup_8_done

    [Constraints]

    [Bindings]
    nohup cd senss; nohup perl random.pl nosig 1 5 > random.nosig.correct.0 &
    nohup_2 cd senss; nohup perl random.pl nosig 10 5 > random.nosig.correct.1 &
    nohup_3 cd senss; nohup perl random.pl nosig 100 5 > random.nosig.correct.2 &
    nohup_4 cd senss; nohup perl random.pl nosig 1000 5 > random.nosig.correct.3 &
    nohup_5 cd senss; nohup perl top.pl nosig 1 5 > top.nosig.correct.0 &
    nohup_6 cd senss; nohup perl top.pl nosig 10 5 > top.nosig.correct.1 &
    nohup_7 cd senss; nohup perl top.pl nosig 100 5 > top.nosig.correct.2 &
    nohup_8 cd senss; nohup perl top.pl nosig 1000 5 > top.nosig.correct.3 &

#Sample Output, with returnType: `json`

{
    "Scenario": [
        "actor0 nohup emit nohup_done",
        "actor1 nohup_2 emit nohup_2_done",
        "actor2 nohup_3 emit nohup_3_done",
        "actor3 nohup_4 emit nohup_4_done",
        "actor4 nohup_5 emit nohup_5_done",
        "actor5 nohup_6 emit nohup_6_done",
        "actor6 nohup_7 emit nohup_7_done",
        "actor7 nohup_8 emit nohup_8_done"
    ],
    "Constraints": [],
    "Bindings": [
        "nohup cd senss; nohup perl random.pl nosig 1 5 > random.nosig.correct.0 &",
        "nohup_2 cd senss; nohup perl random.pl nosig 10 5 > random.nosig.correct.1 &",
        "nohup_3 cd senss; nohup perl random.pl nosig 100 5 > random.nosig.correct.2 &",
        "nohup_4 cd senss; nohup perl random.pl nosig 1000 5 > random.nosig.correct.3 &",
        "nohup_5 cd senss; nohup perl top.pl nosig 1 5 > top.nosig.correct.0 &",
        "nohup_6 cd senss; nohup perl top.pl nosig 10 5 > top.nosig.correct.1 &",
        "nohup_7 cd senss; nohup perl top.pl nosig 100 5 > top.nosig.correct.2 &",
        "nohup_8 cd senss; nohup perl top.pl nosig 1000 5 > top.nosig.correct.3 &"
    ]
}
```

## Exception handling
``` json
{
  "_id": "uuid",
  "errors": "error msg"
}
```
| Error msg |
| --- |
| Not Vaild Format, should be bash, magi or go. |
| Not Vaild ReturnType, should be dew or json. |
| Not Vaild File. |
| File is empty. |
| Can not read from server. |
| Out of bounds: {name}, has size of: {len(value)}, but should be between {expected_min} and {expected_max}. |
| Unexpected field: {name}. |
| Missing value: {name}. |
| Not find correct api request url. |
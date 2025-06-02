from flask import Flask, render_template, session, request, make_response
from flask_kvsession import KVSessionExtension
import json
import redis

# Functions we can use from the Constraint Solver
import requestSolver

# Since our json blobs describing our constraints and resources can get big,
# we need better backend storage for our Flask sessions.  There's other
# benefits (such as working on the session data when the client disconnects)
# which we may use later as well.
from simplekv.memory.redisstore import RedisStore

# To have the below work, you will need a Redis server running locally. 
# Local + port 6379 is the default which should start if you run "% redis-server"
store = RedisStore(redis.StrictRedis(host='127.0.0.1', port = 6379, db =0))
app = Flask(__name__)
KVSessionExtension(store, app)
app.config['JSON_SORT_KEYS'] = False

@app.route("/site_solutions", methods=['POST'])
def site_solutions():

    try:
        constraints = request.get_json()
    except Exception as e:
        print(e)
        return "Could not parse json request"
    solver = requestSolver.requestSolver()

    ### XXX Something's broken here - as the solver is sensitive to the order of json keys. Why??
    #print(json.dumps(constraints))
    #tmpResourceList = session.get("enclave_resources", [])
    # XXX So we're cheating :-/
    root = ""
    with open(root + "sites/emu.json") as f:
        emu_json = json.load(f)
    with open(root + "sites/cellular.json") as f:
        cellular_json = json.load(f)
    with open(root + "sites/iot.json") as f:
        iot_json = json.load(f)

    tmpResourceList = [emu_json, cellular_json, iot_json]
    result = solver.trySubsets(constraints, tmpResourceList, resource_names=['EMU', 'Cellular', 'IoT'])
    
    print(result)
    return json.dumps(result)
    
# solve_request: solve
# input json blob of constraints
# returns names, solutions
@app.route("/sr_solve", methods=['POST'])
def sr_solve():
    constraints = request.get_json()
    solver = requestSolver.requestSolver()
    ### XXX Something's broken here - as the solver is sensitive to the order of json keys. Why??
    #print(json.dumps(constraints))
    #tmpResourceList = session.get("enclave_resources", [])
    # XXX So we're cheating :-/
    root = ""
    with open(root + "sites/emu.json") as f:
        emu_json = json.load(f)
    with open(root + "sites/cellular.json") as f:
        cellular_json = json.load(f)
    with open(root + "sites/iot.json") as f:
        iot_json = json.load(f)
    with open(root + "experiments/small-world.json") as f:
        small_world_json = json.load(f)

    tmpResourceList = [emu_json, cellular_json, iot_json]

    names, solution = solver.solve(constraints, tmpResourceList)
    
    print(names)
    print(solution)

    print("\n** Seeking solutions with fewer groups of resources")
    sub_solutions = solver.sub_enclave_solution(small_world_json, tmpResourceList)

    # Create ranges of possible values for features of requested nodes and networks based on the resources
    ranges = solver.gather_properties(tmpResourceList)

    # To count the number of solutions call this (may take time, not yet smart about combinatorics)
    #print '\n** Counting solutions'
    print("\n** Counting solutions")
    count = solver.count_solutions(small_world_json, tmpResourceList)
    #print 'found', count, 'solutions'
    print("Found %d solutions" % (count))
    
    return "done"

@app.route("/getResourceList", methods=['POST'])
def getResourceList():
    type = request.form.get('type')

    ### XXX Something's broken here - as the solver is sensitive to the order of json keys. Why??
    #print(json.dumps(constraints))
    #tmpResourceList = session.get("enclave_resources", [])
    # XXX So we're cheating :-/
    root = ""
    with open(root + "sites/emu.json") as f:
        emu_json = json.load(f)
    with open(root + "sites/cellular.json") as f:
        cellular_json = json.load(f)
    with open(root + "sites/iot.json") as f:
        iot_json = json.load(f)
    with open(root + "experiments/small-world.json") as f:
        small_world_json = json.load(f)

    tmpResourceList = [emu_json, cellular_json, iot_json]    
    
    solver = requestSolver.requestSolver()
    r = solver.gather_properties(tmpResourceList)
    
    resp = []
    if type == 'os':
        resp = list(r['image'])
    if type == 'nodetype' or type == 'platform':
        resp = list(r['platform'])
    
    return make_response(json.dumps(resp))

    
# Not clear we need this? 
@app.before_request
def session_management():
    #print("Make session indefintely long.")
    session.permanent = True
    
@app.route("/")
def index():
    bob = session.get("foo", "default")
    if bob != "foo":
        session['foo'] = "foo"
    session['var_map'] = {}
    session['num_to_var'] = {}
    session['solver'] = requestSolver.requestSolver()
    return bob

@app.route("/read")
def read():
    # Retreive value
    try:
        foo = session["foo"]
        print(foo)
    except:
        print("No value found for foo.")
        return "None"
    return session["foo"]

# Add resources (really site resource descriptions) as a json blob.
# For now, this is called per site/json blob.
@app.route("/addResource", methods=['POST'])
def readConstraints():
    if request.json:
        mydata = request.json
        tmpResourceList = session.get("enclave_resources", [])
        tmpResourceList.append(mydata)
        session["enclave_resources"] = tmpResourceList
        return "json received"
    else:
        return "no json received"

# For debugging - returns all the resources (full json blobs) for this
# client/session.
@app.route("/printResources")
def printResources():
    rstr = "Resources: "
    i = 0
    for r in session["enclave_resources"]:
        i = i+1
        rstr = rstr + str(i) + " IS  " + json.dumps(r) + "\n AND \n"
    return rstr

    
    

# This Flask server should be started after redis, and before GUI (or other
# programs using the constraint solver's API)
if __name__ == '__main__':
    app.secret_key = 'super secret key'
    app.config['SESSION_TYPE'] = 'filesystem'
    app.run()

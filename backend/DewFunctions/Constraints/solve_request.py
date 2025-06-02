import itertools
import sys

if sys.version_info >= (3,0):
    import pycosat
else:
    #import pycosat.pycosat
    import pycosat
import json
import copy
import time
import collections

### XXX working to make not global?
var_map = dict()
num_to_var = dict()

# Adapting the version written to my standard to work for xir json


# Overall interface creates a SAT problem from a list of nodes and connections, solves it,
# and writes out the assignment in 'network' form
# Note: for 3000 resources, generating the clauses takes 60 seconds and solving takes 4.5 seconds on a 2015 macbook pro.
# In production it may be possible to generate some or all of the resource clauses ahead of time.
#       - see 'todo' for generate_clauses
def solve(request, resources, print_debug=False, print_vars=False, print_names=False, print_assignment=True, print_timing=True):
    global var_map, num_to_var
    start = time.time()
    clauses = generate_clauses(request, resources, print_debug)
    create = time.time()
    if print_timing:
        # Print 2.x
        #print 'Creating', len(clauses), 'clauses and', len(var_map), 'variables took', (create-start)
        # 
        # Print 3.x
        print("Creating %d clauses and %d variables took %.2f" % (len(clauses),len(var_map),create-start))
    #solution = pycosat.pycosat.solve(clauses)
    solution = pycosat.solve(clauses)
    if print_timing:
        # Print 2.x
        #print 'Solving took', (time.time()-create)
        # 
        # Print 3.x
        print('Solving took %.2f' % (time.time()-create))
    #print solution  # , list(clauses)
    if print_vars:
        #print 'True vars:'
        print('True vars:')
    # Just print the match vars and variables about matched resources and topos, and say how many are true in total
    num_true = 0
    names = []
    if solution == 'UNSAT':
        #print 'no solution found for', len(clauses), 'clauses'
        print('No solution found for %d clauses' % len(clauses))
        return None, None
    #return None, None
    
    for variable in solution:
        if variable > 0:
            num_true += 1
            var = num_to_var[variable]
            if 'matched_to' in var:
                if print_vars:
                    #print variable, var
                    print("%d %s" % (variable, var))
                names.append((var[0:var.index("_matched")], var[var.index("matched_to_") + 11:]))
    if print_vars:
        for variable in solution:
            if variable > 0 and [x for (x, y) in names if x in num_to_var[variable]]:
                #print num_to_var[variable]
                print(num_to_var[variable])
        #print num_true, 'were true'
        print("%d were true" % num_true)
    if print_names:
        #print 'names:', names
        print("Name: ")
        print(names)
    # Print the ids of the matched pairs for verification. This is slow, probably need another dict or two
    if print_assignment:
        for pair in names:
            #print [n['props']['name'] for n in request['nodes'] if n['id'] == pair[0]][0],  # skip id pair[0]
            matches = [[n['props']['name'] for n in rsrc['nodes'] if n['id'] == pair[1]] for rsrc in resources]
            #print 'matched to', [(m[0], i) for i, m in enumerate(matches) if m != []]
    return names, solution


# Generate clauses for solver from the realization request spec and resource spec
# resource_specs should include specific resources and also the '(repeat freq node)' construct used to create
# identical elements, so that they can be matched without creating and matching a large list. This is not yet implemented.
def generate_clauses(request, resources, print_debug=False):
    global var_map, num_to_var, id_link_map

    var_map = {}  # Map of variable names to numbers, e.g. 'droid.software.version=O' -> 1
    num_to_var = {}  # Map from variable numbers to names
    potential_match_map = {}
    clauses = []
    node_site_map = {}  # Each node mapped to its site, to help find across-site solutions later.
    for i, resource in enumerate(resources):
        node_site_map.update({n['id']: i for n in resource['nodes']})
    # First, every node in request should be matched to one node in resources. Each match should be unique unless
    # the resource can be a container.
    # Then, the matching node should be able to satisfy the constraints of the topo node.
    resource_nodes = sum([resource['nodes'] for resource in resources], [])
    #print(resource_nodes)
    #for resource in resources:
    #    print(resource['nodes'])
    #    print("NEXT")
    #exit(1)
    if print_debug:
        #print len(request['nodes']), 'request nodes and', len(resource_nodes), 'resource nodes'
        print("%d request nodes and %d resource nodes" % (len(request['nodes']), len(resource_nodes)))
    for node in request['nodes']:
        #print 'checking request node', node['props']
        # Pairwise exclusivity for query nodes (node bound to at most one resource)
        for rsrc in resource_nodes:
            clauses += [[-match_var(node, rsrc), -match_var(node, r2)] for r2 in resource_nodes if r2 > rsrc]
        #print 'finding clauses from', node['props']['name'], node['props']
        request_clauses = walk_props_for_constraints(node['props'], [])  # path was node.name() but now anonymized
        if print_debug:
            #print 'clauses for', node['props']['name'], request_clauses
            print("Clauses for")
            print(node['props']['name'])
            print(request_clauses)
        # Combine the constraints into every matchable resource node and check which can match
        potential_matches = []
        for rsrc in resource_nodes:
            # If node is matched to r1, then the constraints on node should be true for r1
            #short = short_ids(rsrc)
            # Hide endpoints for now
            #print 'applying these clauses to resource:', {k: short[k] for k in short if k != 'endpoints'}
            #for clause in request_clauses:
            #    print clause
            rclauses = []
            potential_match = True
            for clause in request_clauses:
                grounded = grounded_clause(clause, rsrc)
                if grounded and True not in grounded: # Don't add the clause if it contains True, as it is satisfiable without making a choice
                    rclauses.append([[-match_var(node, rsrc)] + grounded])
                elif not grounded:  # If one clause can't be satisfied, the resource can't be used for the request node
                    potential_match = False
                    break
            if potential_match:
                clauses += rclauses
                potential_matches.append(rsrc)
            for clause in request_clauses:
                for (t, path, value) in clause:
                    v, found = find_or_add_var(rsrc['id'] + "." + reduce(lambda x, y: str(x) + "." + str(y), path), value)
                    if not found:  # First time we encounter the variable on a resource, check its truth
                        clauses.append([v * walk_resource_for_truth(rsrc['props'], path, value)])
                # The node is matched to some resource that can match the constraints
        potential_match_map[node['props']['name']] = potential_matches
        clauses.append([match_var(node, potential_resource) for potential_resource in potential_matches])
    # Pairwise exclusive for resource nodes
    for r in resource_nodes:
        for t1 in request['nodes']:
            clauses += [[-match_var(t1, r), -match_var(t2, r)] for t2 in request['nodes'] if t2 > t1]
    # Check links and add pairwise exclusive for match variables that would imply impossible link constraints
    # First create a link map for all the resource links since we'll be looking them up maybe n^2 times
    id_link_map = {}
    for resource in resources:
        for link in resource['links']:
            for ep in link['endpoints']:
                id_link_map[ep['id']] = link
    for link in request['links']:
        if print_debug:
            #print 'link:', link['id'], link['props']
            print("link: %s %s" % (link['id'], link['props']))
        endpoints = [e['id'] for e in link['endpoints']]
        if print_debug:
            #print '  endpoints:', endpoints
            print(endpoints)
        link_nodes = [n for n in request['nodes'] if [id for id in [en['id'] for en in n['endpoints']] if id in endpoints]]
        if print_debug:
            #print '    matches:', [ln['props']['name'] for ln in link_nodes]
            print("	matches:" )
            print([ln['props']['name'] for ln in link_nodes])
        # for every pair of possible matches for the two request nodes, check the link exists and matches the specs,
        #  and if not add a mutually exclusive constraint
        some_link_ok = False
        for pma in potential_match_map[link_nodes[0]['props']['name']]:
            for pmb in potential_match_map[link_nodes[1]['props']['name']]:
                if not link_ok(pma, pmb, link['props'], id_link_map, node_site_map):
                    # if the link won't work, don't use this pair of matches
                    clauses += [[-match_var(link_nodes[0], pma), -match_var(link_nodes[1], pmb)]]
                else:
                    some_link_ok = True
        if not some_link_ok and print_debug:
            print('  link unmatched')
    return clauses


# Recursively walk over the dict for a query node gathering constraints.
# Currently this returns a triple: (truth (+/-1), path, value), which is turned into a variable for each resource.
def walk_props_for_constraints(desc, path):
    res = []
    for key in desc:
        if key == 'name' or key == 'config':  # Don't add constraints for these (maybe infer from config later)
            continue
        if isinstance(desc[key], list):
            #print 'adding constraints for', path, key, desc[key]
            # Parse constraints here
            new_var_path = path + [key]
            if desc[key][0] == 'in':  # Add a clause with each possible value in a conjunction, and pairwise exclusive
                res += [[(1, new_var_path, value) for value in desc[key][1]]]  # Was the var with this name
                for value in desc[key][1]:
                    res += [[(-1, new_var_path, value), (-1, new_var_path, other)]
                            for other in desc[key][1] if other > value]  # was the var with these names
            elif desc[key][0] in ['>=', '>', '<=', '<']:  # Add a token for a generic value satisfying the inequality
                res += [[(1, new_var_path, "|" + desc[key][0] + str(desc[key][1]) + "|")]]  # Was the var with this name
            else:
                #print 'not currently translating the constraint:', path, key, desc[key]
                print("not currently translating the constraint: ")
                print(path)
                print(key)
                print(desc[key])
        elif isinstance(desc[key], dict) and 'constraint__' in desc[key]:  # This is a constraint
            res.append([(1, path + [key], desc[key])])
        elif isinstance(desc[key], dict):
            res += walk_props_for_constraints(desc[key], path + [key])
        elif key != "name" or path != "":  # Add an equality constraint for a value, except the object name
            res.append([(1, path + [key], desc[key])])
    return res


def grounded_clause(constraint_clause, resource):
    # The clause is a list of unbounded variables to be bound to the resource (ultimately to other constraint vars to)
    # For efficiency, also checks truth and skips any constraint_var in the clause that cannot be true.
    # If none can be true then generate_clauses turns into the unary clause saying the resource cannot match.
    # It might be more efficient never to generate this match variable but it's only a unary clause..
    return [x for x in [grounded_prop(prop, resource) for prop in constraint_clause] if x != [] and x is not False]


def grounded_prop(triple, resource, indent=""):
    (truth, path, value) = triple
    s = short_ids(resource)
    #print indent+'need to ground', (truth, path, value), '\n  '+indent+'with', follow_path(path, s['props'])
    props = resource['props']
    if isinstance(value, dict) and 'constraint__' in value:
        if value['constraint__'] == '?':  # choice
            res = []
            for sub_value in value['value__']:
                grounded = grounded_prop((truth, path, sub_value), resource, indent + "  ")
                if grounded is True:
                    return True
                elif grounded is not False and grounded != []:
                    res.append(grounded)
            return res
        elif value['constraint__'] == '[]':  # One of a list
            res_vals = follow_path(path, props)
            return isinstance(res_vals, list) and value['value__'] in res_vals
        elif value['constraint__'] in ['>=', '>', '<', '<=']:
            res_val = follow_path(path, props)
            #print 'here', value, res_val
            if value['constraint__'] == '>=':
                return res_val >= value['value__']  # brittle right now
            elif value['constraint__'] == '>':
                return res_val > value['value__']  # brittle right now
            if value['constraint__'] == '<=':
                return res_val <= value['value__']  # brittle right now
            elif value['constraint__'] == '<':
                return res_val < value['value__']  # brittle right now
        else:
            #print 'not currently translating the constraint:', value, 'on', props
            print("not currently translating the constraint:")
            print(value)
            #print(on)
            print(props)
            # Will crash
    else:
        return 1


# Recursively walk a path on a dict. Returns None if there is no path.
def follow_path(path, d):
    if path == []:
        return d
    elif path[0] in d:
        return follow_path(path[1:], d[path[0]])


# Recursively walk over a resource given a constraint path, value and corresponding variable. Return +/-1
# depending on the values in the resource. Doesn't yet handle 'image' list of possible images.
def walk_resource_for_truth(d, path, value):
    # print 'checking', path, '=', value, 'on', d
    if not path or path[0] not in d:
        return -1
    elif len(path) == 1:
        if d[path[0]] == value:
            return 1
        elif isinstance(value, str) and value.startswith('|>='):  # Need the other cases
            return 1 if d[path[0]] >= float(value[3:-1]) else -1
        else:
            return -1
    elif isinstance(d[path[0]], dict):
        return walk_resource_for_truth(d[path[0]], path[1:], value)
    else:
        return -1


# Define a variable stating that this resource satisfies this constraint
def resource_constraint_var(resource, path, value):
    if isinstance(value, dict):
        #print 'dict is', value
        print("dict is %s" % value)
    else:
        return find_or_add_var(resource['id'] + path, value)  # Equality variable


def link_ok(n1, n2, link_props, id_link_map, node_site_map):
    #print 'checking', n1['props']['name'], n2['props']['name'], link_props
    # Find the link, or allow if they are on different groups, assuming an internet link
    # If they are on the same site, assume there's a switch. Otherwise assume a slow internet link
    return True
    if node_site_map[n1['id']] != node_site_map[n2['id']]:
        #print '  link ok, they are on different sites'
        return True
    link = None
    for ep in n1['endpoints']:
        if ep['id'] not in id_link_map:
            #print 'end point not linked:', ep['id']
            continue
        req_link = id_link_map[ep['id']]
        other_ep = [epo['id'] for epo in req_link['endpoints'] if epo['id'] != ep['id']][0]
        if other_ep in [ep2['id'] for ep2 in n2['endpoints']]:
            #print '  link is', req_link
            link = req_link
            break
    if link is None:
        #print '  no link'
        return False
    return True


# Convenience. Return the variable that says this query node is matched to this resource node in the solution
def match_var(query_node, resource_node):
    v, found = find_or_add_var(query_node['id'], resource_node['id'], '_matched_to_')
    return v


# Return the variable that says this path should have this value. Create if necessary.
def find_or_add_var(path, value, relation="="):
    global var_map, num_to_var
    var_name = path + relation + str(value)
    found = True
    if var_name not in var_map:
        found = False
        var_map[var_name] = len(var_map) + 1
        num_to_var[var_map[var_name]] = var_name
    return var_map[var_name], found


# Functions that help manipulate sets of solutions.
def count_solutions(request, resources):
    clauses = generate_clauses(request, resources)
    #iter = pycosat.pycosat.itersolve(clauses)
    iter = pycosat.itersolve(clauses)
    count = 0
    try:
        while True:
            iter.next()
            count += 1
    except:
        return count
    return count


# Assuming there is a solution using this set of resources, is there a solution with a smaller set?
# Inefficient to constantly re-generate the clauses but if there are not too many resources it's not too bad.
def sub_enclave_solution(request, resources):
    sub_solutions = []
    for res in resources:
        sublist = list(resources)
        sublist.remove(res)
        names, solution = solve(request, sublist)
        if solution is not None:
            #print 'found a sub-enclave solution leaving out', res
            print("found a sub-enclave solution leaving out %s " % res)
            sub_solutions.append((names, solution))
    return sub_solutions


# Take a list of enclaves and produce the list of property values for each property found for nodes. Will generalize.
def gather_properties(enclaves):
    v = dict()
    v['endpoints'] = dict()
    for enclave in enclaves:
        for n in enclave['nodes']:
            if 'props' in n:
                add_to_properties(n['props'], v)
            if 'endpoints' in n:
                for e in n['endpoints']:
                    if 'props' in e:
                        add_to_properties(e['props'], v['endpoints'])
    return v


def add_to_properties(data, val_dict, indent=0):
    for prop in data:
        if prop == 'nic' or prop == 'name':  # Remove these for now, though we could help a user address specific resources
            continue
        node_value = data[prop]
        # Replace {'value__': X, 'constraint__': '='} with X. I don't see why resources would have other kinds of constraints
        if type(node_value) is dict and 'value__' in node_value and 'constraint__' in node_value and node_value['constraint__'] == '=':
            node_value = node_value['value__']
        if type(node_value) is list:
            if prop not in val_dict:
                val_dict[prop] = set()
            for val in node_value:
                if isinstance(val, collections.Hashable):  # Should recursively add values
                    val_dict[prop].add(val)
        elif type(node_value) is dict:  # Should recursively add values
            #print ' '*indent, indent, 'recursively adding values for', prop, data[prop]
            if prop not in val_dict:
                val_dict[prop] = dict()
            add_to_properties(node_value, val_dict[prop], indent + 2)
        else:
            if prop not in val_dict:
                val_dict[prop] = set()
            val_dict[prop].add(node_value)


# To help look at this, remove the long id names
ids = dict()


def short_ids(orig_site):
    site = copy.deepcopy(orig_site)
    rec_shorten_ids(site)
    return site


def rec_shorten_ids(d):
    for k in d:
        if k in ['id', 'nic']:
            if d[k] not in ids:
                ids[d[k]] = len(ids)
            d[k] = ids[d[k]]
        elif isinstance(d[k], dict):
            rec_shorten_ids(d[k])
        elif isinstance(d[k], list):
            for v in d[k]:
                if isinstance(v, dict):
                    rec_shorten_ids(v)

def trySubsets(request, resources):
    indexSet = set([])
    indexSet.update(range(0, len(resources)))
    combos = set([])
    for i in range(1, len(resources)):
        combos.update(set(itertools.combinations(indexSet, i)))
    
    solutions = []
    
    for combo in combos:
        subresourcelist = []
        for x in combo:
            subresourcelist.append(resources[x])
        names, solution = solve(request, subresourcelist)
        print(list(combo))
        comboResult = {}
        comboResult['site_combo'] = list(combo)
        if names != None:
            print("Has solution:")
            print(names)
            comboResult['solution'] = True
        else:
            print("Has no solution")
            comboResult['solution'] = False
        solutions.append(comboResult)
        
    print(solutions)
        
    

if __name__ == "__main__":

    # Import json resources for the example sites
    #root = "/Users/jim/repo/Projects/Bridge/CEF/git/xir/examples/"
    root = ""
    with open(root + "sites/emu.json") as f:
        emu_json = json.load(f)
    with open(root + "sites/cellular.json") as f:
        cellular_json = json.load(f)
    with open(root + "sites/iot.json") as f:
        iot_json = json.load(f)
    #with open(root + "experiments/small-world.json") as f:
    #    small_world_json = json.load(f)
    with open(root + "experiments/test.json") as f:
        small_world_json = json.load(f)
    

    resources = [emu_json, cellular_json, iot_json]

    r = gather_properties(resources)
    #print(r['image'])
    #exit()

    trySubsets(small_world_json, resources)
    exit()
    
    # Solve the problem and look for solutions with fewer enclaves
    print(small_world_json)
    print(resources)
    names, solution = solve(small_world_json, resources)
    print("Names: ")
    print(names)
    print("Solutions ")
    print(solution)

    #print '\n** Seeking solutions with fewer groups of resources'
    print("\n** Seeking solutions with fewer groups of resources")
    sub_solutions = sub_enclave_solution(small_world_json, resources)

    # Create ranges of possible values for features of requested nodes and networks based on the resources
    ranges = gather_properties(resources)

    # To count the number of solutions call this (may take time, not yet smart about combinatorics)
    #print '\n** Counting solutions'
    print("\n** Counting solutions")
    count = count_solutions(small_world_json, resources)
    #print 'found', count, 'solutions'
    print("Found %d solutions" % (count))
    
    

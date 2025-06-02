import requests
import json

s = requests.Session()

headers = {'content-type': 'application/json'}
pushConstraintsUrl='http://127.0.0.1:5000/addResource'
mainUrl = 'http://127.0.0.1:5000/'

root = ""
with open("experiments/test.json") as f:
    small_world_json = json.load(f)

#with open(root + "experiments/small-world.json") as f:
#    small_world_json = json.load(f)

print(json.dumps(small_world_json))
r = s.post(mainUrl + 'site_solutions', json=small_world_json)

if 'results' in json.loads(r.json()):
    for result in json.loads(r.json())['results']:
        if result['result'] == 'solution':
            print("Solution from %s" % " ".join(result['site_combo']))

exit()

r = s.get('http://127.0.0.1:5000/')

root = ""
with open(root + "sites/emu.json") as f:
    jsonblob = json.load(f)
r = s.post(pushConstraintsUrl, json=jsonblob)

with open(root + "sites/cellular.json") as f:
    jsonblob = json.load(f)
r = s.post(pushConstraintsUrl, json=jsonblob)

with open(root + "sites/iot.json") as f:
    iot_json = json.load(f)
r = s.post(pushConstraintsUrl, json=jsonblob)

#r = s.get(mainUrl + "printResources")
#print(r.content)

with open(root + "experiments/small-world.json") as f:
    small_world_json = json.load(f)

print(json.dumps(small_world_json))
r = s.post(mainUrl + 'sr_solve', json=small_world_json)

r = s.post(mainUrl + 'getResourceList', data={'type':'os'})
data = json.loads(r.content)
for item in data:
    print(item)


    
#!/usr/bin/env python3
import xir

site = xir.Network({})

# droids
droids = [ site.node({
    'name': 'droid'+str(i),
    'platform': 'pixel',
    'cpu': { 'model': 'coretex', 'arch': 'armv8', 'cores': 4 },
    'bus': [{ 'type': 'pci' }],
    'memory': { 'capacity': xir.gB(2) },
    'disk': { 'capacity': xir.gB(32) },
    'image': ['andriod', 'android-o', 'android-n'],
    'alloc': ['unit'],
    },
    [xir.Endpoint({'type': 'lte', 'speed': xir.mbps(10), 'bus': 'pci'})]
    ) for i in range(4) ]

# iphones
iphones = [ site.node({
    'name': 'iphone'+str(i),
    'platform': 'iphone7',
    'cpu': { 'arch': 'armv8', 'cores': 4 },
    'bus': [{ 'type': 'pci' }],
    'memory': { 'capacity': xir.gB(2) },
    'disk': { 'capacity': xir.gB(16) },
    'image': ['ios', 'ios-10', 'ios-11'],
    'alloc': ['unit']
    },
    [xir.Endpoint({'type': 'lte', 'speed': xir.mbps(10), 'bus': 'pci'})]
    ) for i in range(4) ]

# hummingbrid node
hb = site.node({
    'name': 'hummingbird',
    'alloc': ['virtual', 'static']
    },
    [xir.Endpoint({'type': 'ethernet', 'speed': xir.gbps(10)}) for _ in range(2) ] 
    )

# do not model uplinks to internet or control plane links, just experiment
# plane downlinks
gw = site.node({
    'name': 'gateway',
    'alloc': ['virtual', 'static']
    },
    [xir.Endpoint({'type': 'ethernet', 'speed': xir.gbps(10)}) for _ in range(1) ] 
    )

# network
tower = site.node(
        {'name': 'tower', 'alloc': ['static', 'virtual']},
        [xir.Endpoint({'type': 'lte', 'speed': xir.mbps(10)}) for _ in range(9) ]
        )

# link up droids
for i,x in enumerate(droids):
    site.link([x.endpoints[0], tower.endpoints[i]],{})

# link up iphones
for i,x in enumerate(iphones):
    site.link([x.endpoints[0], tower.endpoints[len(droids)+i]], {})


# link up egress path
site.link([tower.endpoints[8], hb.endpoints[0]], {})
site.link([hb.endpoints[0], gw.endpoints[0]], {})


print(site.xir())


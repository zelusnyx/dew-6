package main

import (
	"fmt"
	xir "github.com/ceftb/xir/lang/go"
)

func main() {

	world := xir.NewNet()

	var routers [3]*xir.Node

	//Internet Model
	for i := 0; i < 3; i++ {
		routers[i] = world.Node().
			Set(xir.Props{
				"name": fmt.Sprintf("r%d", i),
			}).
			AddSoftware(xir.Props{
				"name=": "cumulus",
			})

	}
	for i := 0; i < 3; i++ {
		world.Link(routers[i].Endpoint(), routers[(i+1)%3].Endpoint()).
			Set(xir.Props{
				"bandwidth": xir.Unit("-", 2.5, "mbps"),
				"latency":   xir.Unit("+", 7, "ms"),
				"loss":      xir.Unit("-", 3, "%"),
			})
	}

	//Cellular Network
	tower := world.Node().
		Set(xir.Props{
			"name":     "tower",
			"belugas=": 47,
		}).
		AddSoftware(xir.Props{
			"name=": "lte-linux",
		})

	for i := 0; i < 3; i++ {
		n := world.Node().
			Set(xir.Props{
				"name": fmt.Sprintf("droid%d", i),
			}).
			AddSoftware(xir.Props{
				"name=": "android-7",
			})
		world.Link(n.Endpoint(), tower.Endpoint()).
			Set(xir.Props{
				"bandwidth": xir.Unit("-", 1, "mbps"),
				"latency":   xir.Unit("+", 27, "ms"),
				"loss":      xir.Unit("-", 10, "%"),
			})
	}
	world.Link(tower.Endpoint(), routers[0].Endpoint()).
		Set(xir.Props{
			"bandwidth": xir.Unit("-", 100, "mbps"),
			"latency":   xir.Unit("+", 3, "ms"),
			"loss":      xir.Unit("-", 2, "%"),
		})

	//Home Network
	rtr := world.Node().
		Set(xir.Props{
			"name": "rtr",
		}).
		AddSoftware(xir.Props{
			"name=": "vyatta",
		})
	world.Link(rtr.Endpoint(), routers[1].Endpoint()).
		Set(xir.Props{
			"bandwidth": xir.Unit("-", 25, "mbps"),
			"latency":   xir.Unit("+", 11, "ms"),
			"loss":      xir.Unit("-", 4, "%"),
		})

	n := world.Node().
		Set(xir.Props{
			"name": "bob-phone",
		}).
		AddSoftware(xir.Props{
			"name=": "android",
		})
	world.Link(n.Endpoint(), rtr.Endpoint()).
		Set(xir.Props{
			"bandwidth": xir.Unit("-", 100, "mbps"),
			"latency":   xir.Unit("+", 5, "ms"),
			"loss":      xir.Unit("-", 2, "%"),
		})

	n = world.Node().
		Set(xir.Props{
			"name": "alice-phone",
		}).
		AddSoftware(xir.Props{
			"name=": "android-6",
		})
	world.Link(n.Endpoint(), rtr.Endpoint()).
		Set(xir.Props{
			"bandwidth": xir.Unit("-", 100, "mbps"),
			"latency":   xir.Unit("+", 8, "ms"),
			"loss":      xir.Unit("-", 3, "%"),
		})

	n = world.Node().
		Set(xir.Props{
			"name": "tv",
		}).
		AddSoftware(xir.Props{
			"name=": "plex",
		})
	world.Link(n.Endpoint(), rtr.Endpoint()).
		Set(xir.Props{
			"bandwidth": xir.Unit("-", 100, "mbps"),
			"latency":   xir.Unit("+", 4, "ms"),
			"loss":      xir.Unit("-", 2, "%"),
		})

	n = world.Node().
		Set(xir.Props{
			"name": "homepc",
		}).
		AddSoftware(xir.Props{
			"name=": "windows-10",
		})
	world.Link(n.Endpoint(), rtr.Endpoint()).
		Set(xir.Props{
			"bandwidth": xir.Unit("-", 1, "gbps"),
			"latency":   xir.Unit("+", 0.1, "ms"),
			"loss":      xir.Unit("-", 0.1, "%"),
		})

	//Service Provider
	gw := world.Node().
		Set(xir.Props{
			"name": "edge",
			"phys": "true",
		}).
		AddSoftware(xir.Props{
			"name=": "freebsd-11",
		})
	world.Link(gw.Endpoint(), routers[1].Endpoint()).
		Set(xir.Props{
			"bandwidth": xir.Unit("-", 100, "gbps"),
			"latency":   xir.Unit("+", 0.1, "ms"),
			"loss":      xir.Unit("-", 0.1, "%"),
		})

	for i := 0; i < 4; i++ {
		n = world.Node().
			Set(xir.Props{
				"name": fmt.Sprintf("srv%d", i),
			}).
			AddSoftware(xir.Props{
				"name=": "centos-7",
			})
		world.Link(gw.Endpoint(), n.Endpoint()).
			Set(xir.Props{
				"bandwidth": xir.Unit("-", 40, "gbps"),
				"latency":   xir.Unit("+", 0.1, "ms"),
				"loss":      xir.Unit("-", 0.1, "%"),
			})
	}

	//Enterprise
	fw := world.Node().
		Set(xir.Props{
			"name": "firewall",
		}).
		AddSoftware(xir.Props{
			"name=": "palo-alto",
		})
	world.Link(fw.Endpoint(), routers[2].Endpoint()).
		Set(xir.Props{
			"bandwidth": xir.Unit("-", 100, "mbps"),
			"latency":   xir.Unit("+", 3, "ms"),
			"loss":      xir.Unit("-", 0.8, "%"),
		})

	bk := world.Node().
		Set(xir.Props{
			"name": "backbone",
		}).
		AddSoftware(xir.Props{
			"name=": "cumulus",
		})
	world.Link(bk.Endpoint(), fw.Endpoint()).
		Set(xir.Props{
			"bandwidth": xir.Unit("-", 10, "gbps"),
			"latency":   xir.Unit("+", 3, "ms"),
			"loss":      xir.Unit("-", 0.8, "%"),
		})

	for i := 0; i < 2; i++ {
		wk := world.Node().Set(xir.Props{
			"name": fmt.Sprintf("workgroup%d", i),
		}).
			AddSoftware(xir.Props{
				"name=": "cumulus",
			})
		world.Link(wk.Endpoint(), bk.Endpoint()).
			Set(xir.Props{
				"bandwidth": xir.Unit("-", 10, "gbps"),
				"latency":   xir.Unit("+", 2, "ms"),
				"loss":      xir.Unit("-", 0.1, "%"),
			})

		for j := 0; j < 3; j++ {
			n := world.Node().Set(
				xir.Props{
					"name": fmt.Sprintf("workstation%d", i*2+j),
					"phys": "true",
				}).
				AddSoftware(xir.Props{
					"name=": "windows-7",
				})
			world.Link(wk.Endpoint(), n.Endpoint()).
				Set(xir.Props{
					"bandwidth": xir.Unit("-", 1, "gbps"),
					"latency":   xir.Unit("+", 2, "ms"),
					"loss":      xir.Unit("-", 0.2, "%"),
				})
		}
	}

	s, err := world.ToString()
	if err != nil {
		fmt.Printf("error: %v", err)
	} else {
		fmt.Println(s)
	}

}

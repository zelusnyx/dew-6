# DEW (Doer!): Constraint Solving

Included in DEW is a notion of constraints on where an experiment's behavior
is carried out. To help design experiments and map requirements onto
resources, DEW includes support for constraint solving. Currently this is
supported through a Flask-based constraint solving server called the
Constraint Server.

# Installing

You'll need:
	- Python (either 2.x or 3.x)

The python packages:
	- picosat
	- Flask
	- flask-kvsession
	- Xir

And:
	- redis (for flask-kvsession back-end support)

For redis installation and more information see:
	https://redis.io/

For installing Xir, see:
	https://github.com/ceftb/xir
	https://github.com/ceftb/xir/tree/master/lang/python


# Running

To run the Constraint Server: 
	% redis-server
	% python flaskServer.py

The Constraint Server expects the redis server at 127.0.0.1:6379. If you are
not using defaults, you can modify where the server looks for the redis
store server by modifying the "store" variable in the flaskServer.py code.

The DEW GUI expects the Constraint server to run at: http://127.0.0.1:5000/.
This should be the default assuming you are not running other flask
applications. Modify the "mainUrl" in UI/deploy/constraints.py if you use a
different address for your Constraint Server.

If you would like to play with the Constraint Server without the DEW GUI,
you can start with the code in flaskStubClient.py.



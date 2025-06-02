# DEW

Distributed Experiment Workflow

## Building for production

### Frontend
Run `npm run prod` in frontend directory

### Documentation
Run `mkdocs build` in documentation directory

### Backend
We have a Makefile to build the docker image and deploy it.
To build, run `make build` in the backend directory
To deploy, run `make deploy` in the backend directory.

## Deploying to dew.isi.edu

This document discusses the steps to deploy frontend, backend, and documentation to dew.isi.edu

### Pulling the latest code

The first and foremost step before deploying any component is to pull the latest code from github.

The git repository exists in the path `/home/ubuntu/DEW/WEB-APPLICATION`. 

We use SSH-agent forwarding to authenticate with github.

[Guide by Github to setup SSH agent forwarding](https://docs.github.com/en/free-pro-team@latest/developers/overview/using-ssh-agent-forwarding#setting-up-ssh-agent-forwarding) (one time)

After having ssh agent forwarding setup, go to the `WEB-APPLICATION` directory and run `git pull`
```bash
$ cd ~/DEW/WEB-APPLICATION/
$ git pull origin master
```

### Frontend

* Run `npm run prod` in your laptop/device and push the build files to github (dist directory).
*  [Pull the latest code](#pulling-the-latest-code)
* Run `sudo service nginx reload`

Note: We have already setup `nginx` to use `/home/ubuntu/DEW/WEB-APPLICATION/frontend/dist/DEWUI` as the root folder for serving the files. Hence, we just need to reload nginx to remove any cache.

### Documentation

* Run `mkdocs build` in your laptop/device and push the build files to github (site directory).
*  [Pull the latest code](#pulling-the-latest-code)
* Run `sudo service nginx reload`


### Backend

*  [Pull the latest code](#pulling-the-latest-code)
* Go to `/home/ubuntu/DEW/WEB-APPLICATION/backend` directory
* Stop the docker container listening at port 4000
* run `make deploy`


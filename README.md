# README


Tool to allow clicking on points in an image dataset and recording the results
as an overlay on that dataset.

## DataSet serving infrastructure

The dataset should be served using [dserve](https://github.com/JIC-CSB/dserve).

# Installation

```
export DSERVE_HOSTNAME=cigana
npm install
```

## Starting the point picker

```
bash run_docker.sh
```

Point a web browser at the URL: http://localhost:8080/

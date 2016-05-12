int cuCount = 20;

var data = [{
  {
    "id": "0:0",
    "type": 1,
    "start": "n/a",
    "end": "n/a",
    "name": "main",
    "childrenNodes": [
      "0:1"
    ]
  }, {
    "id": "0:1",
    "type": 0,
    "start": "START",
    "end": "END",
    "name": "NAME",
    "childrenNodes": [],
    "readDataSize": 50,
    "writeDataSize": 50,
    "successorCUs": [],
    "localVariableNames": [],
    "globalVariableNames": [],
    "RAWDepsOn": [],
    "WARDepsOn": [],
    "WAWDepsOn": []
  }
}];


var r;
for (var i = 0; i < cuCount; i++) {
  r = Math.floor((Math.random() * 3));
  switch (r) {
    case 0:
      data.push({
        "id": "0:" + (i+2),
        "type": 0,
        "start": "START",
        "end": "END",
        "name": "NAME",
        "childrenNodes": [],
        "readDataSize": 50,
        "writeDataSize": 50,
        "successorCUs": [],
        "localVariableNames": [],
        "globalVariableNames": [],
        "RAWDepsOn": [],
        "WARDepsOn": [],
        "WAWDepsOn": []
      });
  }
}

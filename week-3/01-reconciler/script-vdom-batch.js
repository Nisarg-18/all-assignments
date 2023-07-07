var vDom = [];

function createDomElements() {
  var parentElement = document.getElementById("mainArea");

  let added = 0;
  let updated = 0;
  let deleted = 0;
  var currentChildren = Array.from(parentElement.children);

  // Process each item in the data array
  vDom.forEach(function (item) {
    var existingChild = currentChildren.find((c) => c.dataset.id == item.id);
    if (existingChild) {
      updated++;
      existingChild.children[0] = item.title;
      existingChild.children[1] = item.description;

      currentChildren = currentChildren.filter((c) => c !== existingChild);
    } else {
      added++;
      // Create a new element
      var childElement = document.createElement("div");
      childElement.dataset.id = item.id; // Store the ID on the element for future lookups

      var grandChildElement1 = document.createElement("span");
      grandChildElement1.innerHTML = item.title;

      var grandChildElement2 = document.createElement("span");
      grandChildElement2.innerHTML = item.description;

      var grandChildElement3 = document.createElement("button");
      grandChildElement3.innerHTML = "Delete";
      grandChildElement3.setAttribute("onclick", "deleteTodo(" + item.id + ")");

      childElement.appendChild(grandChildElement1);
      childElement.appendChild(grandChildElement2);
      childElement.appendChild(grandChildElement3);
      parentElement.appendChild(childElement);
    }
  });

  currentChildren.forEach((c) => {
    deleted++;
    parentElement.removeChild(c);
  });

  console.log(added);
  console.log(updated);
  console.log(deleted);
}

function updateVdom(data) {
  console.log("in update vDom");
  vDom = data.map((d) => {
    return {
      id: d.id,
      title: d.title,
      description: d.description,
    };
  });
}

window.setInterval(() => {
  let todos = [];
  for (let i = 0; i < Math.floor(Math.random() * 100); i++) {
    todos.push({
      title: "Go to gym",
      description: "Go to gym form 5",
      id: i + 1,
    });
  }
  updateVdom(todos);
}, 1000);

window.setInterval(() => {
  createDomElements(vDom);
}, 5000);

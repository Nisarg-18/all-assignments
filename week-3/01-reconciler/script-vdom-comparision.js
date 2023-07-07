var vDom = [];
function createDomElements(existingDom, vDom) {
  var parentElement = document.getElementById("mainArea");

  let added = 0;
  let updated = 0;
  let deleted = 0;

  // Process each item in the data array
  vDom.forEach(function (item) {
    var existingChild = existingDom.find((c) => c.id == item.id);
    if (existingChild) {
      updated++;
      existingChild.title = item.title;
      existingChild.description = item.description;

      existingDom = existingDom.filter((c) => c !== existingChild);
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

  existingDom.forEach((c) => {
    deleted++;
    var child = document.querySelector(`[data-id='${c.id}']`);
    parentElement.removeChild(child);
  });

  console.log(added);
  console.log(updated);
  console.log(deleted);
}

function updateVdom(data) {
  var existingDom = [...vDom];
  vDom = data.map((d) => {
    return {
      id: d.id,
      title: d.title,
      description: d.description,
    };
  });
  createDomElements(existingDom, vDom);
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
}, 5000);

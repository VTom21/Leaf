import { render } from "./main";
import fs from "fs";

let animals_array = [
    {
        name: "animal1",
        age: 16,
        owner: {
            datas: {
                name: "John",
            },
            age: 35
        },
        traits: [
            {
                name: "friendly",
                value: true
            },
            {
                name: "fast",
                value: false
            }
        ]
    },
];
let title = "Animals Website";
let array = [1,2,3,4,5,6,7,8,9,10];

let html = render("index.leaf", {
    animals: animals_array,
    title: title,
    isAnimal: false,
    isAnimal2: true,
    array: array
});

fs.writeFileSync("index.html", html);
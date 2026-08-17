"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./main");
const fs_1 = __importDefault(require("fs"));
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
let array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let html = (0, main_1.render)("index.leaf", {
    animals: animals_array,
    title: title,
    isAnimal: false,
    isAnimal2: true,
    array: array
});
fs_1.default.writeFileSync("index.html", html);
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.component = component;
exports.render = render;
const fs_1 = __importDefault(require("fs"));
function getValue(data, path) {
    if (!path)
        return undefined;
    return path
        .split(".")
        .reduce((value, key) => value?.[key], data);
}
const helpers = {
    upper: (value) => value.toUpperCase(),
    lower: (value) => value.toLowerCase(),
    strlen: (value) => value.length,
    evaluate: (value) => eval(value),
    reverse: (value) => value.split("").reverse().join(""),
    trim: (v) => v.trim(),
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => a / b,
    min: (a, b) => Math.min(Number(a), Number(b)),
    max: (a, b) => Math.max(Number(a), Number(b)),
    round: (value) => Math.round(value),
    absolute: (value) => Math.abs(value),
    randomFloat: (value = 1) => Math.random() * value,
    randomInt: (value = 1) => Math.floor(Math.random() * value),
    first: (array) => array[0],
    last: (array) => array[array.length - 1],
};
function renderString(template, data) {
    return template.replace(/\[\<(.*?)\>\]/g, (_, content) => {
        const [name, ...args] = content.trim().split(/\s+/);
        // Helper
        if (helpers[name]) {
            if (["add", "subtract", "multiply", "divide", "min", "max"].includes(name)) {
                const b = ["min", "max"].includes(name)
                    ? args[1]
                    : args[2];
                return String(helpers[name](Number(args[0]), Number(b)));
            }
            if (name === "evaluate") {
                return String(helpers[name](args.join(" ")));
            }
            const value = getValue(data, args[0]);
            return String(helpers[name](value ?? args[0]));
        }
        // Normal variable
        return String(getValue(data, content) ?? "");
    });
}
function component(name, data) {
    const template = fs_1.default.readFileSync(`components/${name}.leaf`, "utf8");
    return template.replace(/\[\<(.*?)\>\]/g, (_, key) => {
        return data[key.trim()] ?? "";
    });
}
function render(path, data) {
    let template = fs_1.default.readFileSync(path, "utf8");
    template = template.replace(/\<\<(.*?)\>\>/g, (_, name) => {
        return component(name, data);
    });
    template = template.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, name, content) => {
        return data[name].map((item, index) => renderString(content, { ...item, $index: index })).join("");
    });
    template = template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\s+if\s+(\w+)\}\}([\s\S]*?))?(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, condition, yes, elseIfCondition, elseIfContent, no) => {
        if (data[condition]) {
            return yes;
        }
        if (elseIfCondition && data[elseIfCondition]) {
            return elseIfContent;
        }
        return no ?? "";
    });
    return renderString(template, data);
}
//# sourceMappingURL=main.js.map
import fs from "fs";

function getValue(data: any, path: string) {
    if (!path) return undefined;
    return path
        .split(".")
        .reduce((value, key) => value?.[key], data);
}

const helpers: any = {
    upper: (value: string) => value.toUpperCase(),
    lower: (value: string) => value.toLowerCase(),
    strlen: (value: string) => value.length,
    evaluate: (value: string) => eval(value),
    reverse: (value: string) => value.split("").reverse().join(""),
    trim: (v: string) => v.trim(),

    add: (a: number, b: number) => a + b,
    subtract: (a: number, b: number) => a - b,
    multiply: (a: number, b: number) => a * b,
    divide: (a: number, b: number) => a / b ,
    min: (a: number, b: number) => Math.min(Number(a), Number(b)),
    max: (a: number, b: number) => Math.max(Number(a), Number(b)),
    round: (value: number) => Math.round(value),
    absolute: (value: number) => Math.abs(value),
    randomFloat: (value:number = 1) => Math.random() * value,
    randomInt: (value:number = 1) => Math.floor(Math.random() * value),

    first: (array: any[]) => array[0],
    last: (array: any[]) => array[array.length - 1],
}


function renderString(template: string, data: any) {
    return template.replace(
        /\[\<(.*?)\>\]/g,
        (_, content) => {
            const [name, ...args] = content.trim().split(/\s+/);

            // Helper
            if (helpers[name]) {
                if (["add", "subtract", "multiply", "divide", "min", "max"].includes(name)) {
                    const b = ["min", "max"].includes(name)
                        ? args[1]
                        : args[2];

                    return String(
                        helpers[name](
                            Number(args[0]),
                            Number(b)
                        )
                    );
                }

                if (name === "evaluate") {
                    return String(helpers[name](args.join(" ")));
                }


                const value = getValue(data, args[0]);

                return String(
                    helpers[name](value ?? args[0])
                );
            }

            // Normal variable
            return String(getValue(data, content) ?? "");
        }
    );
}

export function component(name: any, data: any){
    const template = fs.readFileSync(`components/${name}.leaf`, "utf8");

    return template.replace(/\[\<(.*?)\>\]/g, (_, key) =>{
        return data[key.trim()] ?? "";
    });
}


export function render(path: string, data: any) {
    let template = fs.readFileSync(path, "utf8");

    template = template.replace(/\<\<(.*?)\>\>/g, (_, name) => {
        return component(name, data);
    }); 

    template = template.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, name, content) => {
            return data[name].map((item: any, index: number) => renderString(content, {...item, $index: index})).join("");
        }
    );

    template = template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\s+if\s+(\w+)\}\}([\s\S]*?))?(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, condition, yes, elseIfCondition, elseIfContent, no) => {
            if (data[condition]) {
                return yes;
            }

            if (elseIfCondition && data[elseIfCondition]) {
                return elseIfContent;
            }

            return no ?? "";
        }
    );

    return renderString(template, data);
}
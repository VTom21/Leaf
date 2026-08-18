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

function renderWhen(template: string, data: any) {
    return template.replace(
        /\{\{#when\s+(.+?)\}\}\s*\n?([\s\S]*?)\n?\s*\{\{endwhen\}\}/g,
        (_, condition, content) => {

            function checkCondition(condition: string) {
                condition = condition.trim();

                // age > 15
                const match = condition.match(
                    /^(.+?)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/
                );

                if (match) {
                    const left = getValue(data, match[1]!.trim());
                    let right: any = match[3]?.trim();

                    // Remove quotes
                    if (
                        (right.startsWith('"') && right.endsWith('"')) ||
                        (right.startsWith("'") && right.endsWith("'"))
                    ) {
                        right = right.slice(1, -1);
                    }
                    // Number
                    else if (!isNaN(Number(right))) {
                        right = Number(right);
                    }
                    // Boolean
                    else if (right === "true") {
                        right = true;
                    }
                    else if (right === "false") {
                        right = false;
                    }
                    // Variable
                    else {
                        right = getValue(data, right);
                    }

                    switch (match[2]) {
                        case ">":
                            return left > right;
                        case "<":
                            return left < right;
                        case ">=":
                            return left >= right;
                        case "<=":
                            return left <= right;
                        case "==":
                            return left == right;
                        case "===":
                            return left === right;
                        case "!=":
                            return left != right;
                        case "!==":
                            return left !== right;
                    }
                }

                // Normal condition:
                // {{#when isAnimal}}
                return Boolean(getValue(data, condition));
            }

            const parts = content.split(
                /\n?\s*\{\{(orwhen\s+.+?|otherwise)\}\}\s*\n?/
            );

            if (checkCondition(condition)) {
                return parts[0].trim();
            }

            for (let i = 1; i < parts.length; i += 2) {
                const branch = parts[i];
                const branchContent = parts[i + 1] ?? "";

                if (branch.startsWith("orwhen ")) {
                    const orCondition = branch
                        .replace("orwhen ", "")
                        .trim();

                    if (checkCondition(orCondition)) {
                        return branchContent.trim();
                    }
                }

                if (branch === "otherwise") {
                    return branchContent.trim();
                }
            }

            return "";
        }
    );
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

template = template.replace(
    /\{\{#cycle\s+(\w+)\}\}\s*\n?([\s\S]*?)\n?\s*\{\{endcycle\}\}/g,
    (_, name, content) => {
        return data[name]
            .map((item: any, index: number) => {
                const itemData = {
                    ...item,
                    $index: index
                };

                let result = renderWhen(content, itemData);

                result = renderString(result, itemData);

                return result.trim();
            })
            .join("\n");
    }
);

template = template.replace(
    /\{\{#when\s+(\w+)\}\}([\s\S]*?)\{\{endwhen\}\}/g,
    (_, condition, content) => {
        const parts = content.split(
            /\{\{(orwhen\s+\w+|otherwise)\}\}/
        );

        // #when
        if (data[condition]) {
            return parts[0];
        }

        // orwhen / otherwise
        for (let i = 1; i < parts.length; i += 2) {
            const branch = parts[i];
            const branchContent = parts[i + 1] ?? "";

            if (branch.startsWith("orwhen ")) {
                const orCondition = branch
                    .replace("orwhen ", "")
                    .trim();

                if (data[orCondition]) {
                    return branchContent;
                }
            }

            if (branch === "otherwise") {
                return branchContent;
            }
        }

        return "";
    }
);

    template = renderWhen(template, data);

    return renderString(template, data);
}
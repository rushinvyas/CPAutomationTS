"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocatorResolver = void 0;
class LocatorResolver {
    static resolve(page, target) {
        if (this.isLocator(target)) {
            return target;
        }
        if (this.isDefinition(target)) {
            return this.resolveDefinition(page, target);
        }
        const selector = target.trim();
        if (!selector) {
            throw new Error("Locator target cannot be empty.");
        }
        if (this.isXPath(selector)) {
            return page.locator(selector);
        }
        const prefixed = this.parsePrefixedSelector(selector);
        if (prefixed) {
            return prefixed(page);
        }
        return page.locator(selector);
    }
    static format(locator, ...values) {
        return values.reduce((currentLocator, currentValue, index) => currentLocator.replace(`{${index}}`, currentValue), locator);
    }
    static isLocator(target) {
        return typeof target === "object" && target !== null;
    }
    static isDefinition(target) {
        return typeof target === "object" && target !== null && "strategy" in target;
    }
    static isXPath(selector) {
        return (selector.startsWith("//") ||
            selector.startsWith("(//") ||
            selector.startsWith(".//") ||
            selector.startsWith("xpath="));
    }
    static parsePrefixedSelector(selector) {
        const separatorIndex = selector.indexOf("=");
        if (separatorIndex <= 0) {
            return undefined;
        }
        const strategy = selector.slice(0, separatorIndex).trim().toLowerCase();
        const value = selector.slice(separatorIndex + 1).trim();
        if (!value) {
            throw new Error(`Locator value is missing for strategy: ${strategy}`);
        }
        switch (strategy) {
            case "css":
                return (page) => page.locator(value);
            case "id":
                return (page) => page.locator(`[id="${this.escapeAttributeValue(value)}"]`);
            case "name":
                return (page) => page.locator(`[name="${this.escapeAttributeValue(value)}"]`);
            case "class":
                return (page) => page.locator(value
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((className) => `[class~="${this.escapeAttributeValue(className)}"]`)
                    .join(""));
            case "text":
                return (page) => page.getByText(value, { exact: true });
            case "partialtext":
            case "containstext":
                return (page) => page.getByText(value);
            case "label":
                return (page) => page.getByLabel(value, { exact: true });
            case "placeholder":
                return (page) => page.getByPlaceholder(value, { exact: true });
            case "title":
                return (page) => page.getByTitle(value, { exact: true });
            case "alt":
                return (page) => page.getByAltText(value, { exact: true });
            case "value":
                return (page) => page.locator(`[value="${this.escapeAttributeValue(value)}"]`);
            case "data":
                return (page) => page.locator(`[data-${this.escapeAttributeValue(value)}]`);
            case "attribute": {
                const [attributeName, ...rest] = value.split("|").map((item) => item.trim());
                const attributeValue = rest.join("|").trim();
                return (page) => attributeValue
                    ? page.locator(`[${attributeName}="${this.escapeAttributeValue(attributeValue)}"]`)
                    : page.locator(`[${attributeName}]`);
            }
            case "testid":
            case "data-testid":
                return (page) => page.getByTestId(value);
            case "role":
                return (page) => {
                    const [roleName, accessibleName] = value.split("|").map((item) => item.trim());
                    if (!roleName) {
                        throw new Error(`Invalid role locator: ${selector}`);
                    }
                    return page.getByRole(roleName, accessibleName ? { name: accessibleName } : {});
                };
            case "xpath":
                return (page) => page.locator(`xpath=${value}`);
            default:
                return undefined;
        }
    }
    static resolveDefinition(page, definition) {
        const strategy = definition.strategy.toLowerCase();
        const exact = definition.exact ?? true;
        const value = definition.value?.trim() ?? "";
        let locator;
        switch (strategy) {
            case "css":
                locator = page.locator(value);
                break;
            case "id":
                locator = page.locator(`[id="${this.escapeAttributeValue(value)}"]`);
                break;
            case "name":
                locator = page.locator(`[name="${this.escapeAttributeValue(value)}"]`);
                break;
            case "class":
                locator = page.locator(value
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((className) => `[class~="${this.escapeAttributeValue(className)}"]`)
                    .join(""));
                break;
            case "text":
                locator = page.getByText(value, { exact });
                break;
            case "partialtext":
            case "containstext":
                locator = page.getByText(value, { exact: false });
                break;
            case "label":
                locator = page.getByLabel(value, { exact });
                break;
            case "placeholder":
                locator = page.getByPlaceholder(value, { exact });
                break;
            case "title":
                locator = page.getByTitle(value, { exact });
                break;
            case "alt":
                locator = page.getByAltText(value, { exact });
                break;
            case "value":
                locator = page.locator(`[value="${this.escapeAttributeValue(value)}"]`);
                break;
            case "data":
                locator = page.locator(`[data-${this.escapeAttributeValue(value)}]`);
                break;
            case "attribute": {
                const attributeName = definition.attributeName?.trim() ?? "";
                const attributeValue = definition.attributeValue?.trim();
                if (!attributeName) {
                    throw new Error("Attribute locator requires attributeName.");
                }
                locator = attributeValue
                    ? page.locator(`[${attributeName}="${this.escapeAttributeValue(attributeValue)}"]`)
                    : page.locator(`[${attributeName}]`);
                break;
            }
            case "testid":
            case "data-testid":
                locator = page.getByTestId(value);
                break;
            case "role":
                locator = page.getByRole(definition.role ?? value, definition.name ? { name: definition.name, exact } : {});
                break;
            case "xpath":
                locator = page.locator(`xpath=${value}`);
                break;
            default:
                throw new Error(`Unsupported locator strategy: ${strategy}`);
        }
        if (definition.nth !== undefined) {
            return locator.nth(definition.nth);
        }
        return locator;
    }
    static escapeAttributeValue(value) {
        return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }
}
exports.LocatorResolver = LocatorResolver;

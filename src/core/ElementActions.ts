import { Locator, Page } from "@playwright/test";

export type LocatorTarget = string | Locator;

export type SelectOptionInput =
  | string
  | number
  | {
      label?: string;
      value?: string;
      index?: number;
    };
export type ElementActionName =
  | "click"
  | "doubleClick"
  | "rightClick"
  | "fill"
  | "type"
  | "append"
  | "check"
  | "uncheck"
  | "setCheckbox"
  | "radio"
  | "select"
  | "hover"
  | "press"
  | "clear"
  | "focus"
  | "blur"
  | "upload"
  | "dragAndDrop";

export type ElementActionOptions = {
  value?: string;
  option?: SelectOptionInput;
  pressKey?: string;
  checked?: boolean;
  filePath?: string;
  destination?: LocatorTarget;
  timeout?: number;
  force?: boolean;
};

export class ElementActions {
  constructor(private readonly page: Page) {}

  public locator(target: LocatorTarget): Locator {
    if (this.isLocator(target)) {
      return target;
    }

    const selector = target.trim();

    if (!selector) {
      throw new Error("Locator target cannot be empty.");
    }

    if (
      selector.startsWith("//") ||
      selector.startsWith("(//") ||
      selector.startsWith(".//") ||
      selector.startsWith("xpath=")
    ) {
      return this.page.locator(selector);
    }

    const separatorIndex = selector.indexOf("=");

    if (separatorIndex > 0) {
      const strategy = selector.slice(0, separatorIndex).trim().toLowerCase();
      const value = selector.slice(separatorIndex + 1).trim();

      if (!value) {
        throw new Error(`Locator value is missing for strategy: ${strategy}`);
      }

      switch (strategy) {
        case "css":
          return this.page.locator(value);
        case "id":
          return this.page.locator(`[id="${this.escapeAttributeValue(value)}"]`);
        case "name":
          return this.page.locator(`[name="${this.escapeAttributeValue(value)}"]`);
        case "class":
          return this.page.locator(
            value
              .split(/\s+/)
              .filter(Boolean)
              .map((className) => `[class~="${this.escapeAttributeValue(className)}"]`)
              .join("")
          );
        case "text":
          return this.page.getByText(value, { exact: true });
        case "partialtext":
        case "containstext":
          return this.page.getByText(value);
        case "label":
          return this.page.getByLabel(value, { exact: true });
        case "placeholder":
          return this.page.getByPlaceholder(value, { exact: true });
        case "title":
          return this.page.getByTitle(value, { exact: true });
        case "alt":
          return this.page.getByAltText(value, { exact: true });
        case "value":
          return this.page.locator(`[value="${this.escapeAttributeValue(value)}"]`);
        case "data":
          return this.page.locator(`[data-${this.escapeAttributeValue(value)}]`);
        case "attribute": {
          const [attributeName, ...rest] = value.split("|").map((item) => item.trim());
          const attributeValue = rest.join("|").trim();
          return attributeValue
            ? this.page.locator(`[${attributeName}="${this.escapeAttributeValue(attributeValue)}"]`)
            : this.page.locator(`[${attributeName}]`);
        }
        case "testid":
        case "data-testid":
          return this.page.getByTestId(value);
        case "role": {
          const [roleName, accessibleName] = value.split("|").map((item) => item.trim());
          return this.page.getByRole(
            roleName as
              | "alert"
              | "button"
              | "checkbox"
              | "dialog"
              | "link"
              | "menuitem"
              | "option"
              | "radio"
              | "tab"
              | "textbox",
            accessibleName ? { name: accessibleName } : {}
          );
        }
        case "xpath":
          return this.page.locator(`xpath=${value}`);
        default:
          break;
      }
    }

    return this.page.locator(selector);
  }

  public async click(
    target: LocatorTarget,
    options: { timeout?: number; force?: boolean } = {}
  ): Promise<void> {
    await this.locator(target).click(options);
  }

  public async doubleClick(
    target: LocatorTarget,
    options: { timeout?: number; force?: boolean } = {}
  ): Promise<void> {
    await this.locator(target).dblclick(options);
  }

  public async rightClick(
    target: LocatorTarget,
    options: { timeout?: number; force?: boolean } = {}
  ): Promise<void> {
    await this.locator(target).click({ ...options, button: "right" });
  }

  public async fill(target: LocatorTarget, value: string): Promise<void> {
    await this.locator(target).fill(value);
  }

  public async type(target: LocatorTarget, value: string): Promise<void> {
    await this.locator(target).pressSequentially(value);
  }

  public async append(target: LocatorTarget, value: string): Promise<void> {
    await this.locator(target).pressSequentially(value);
  }

  public async clear(target: LocatorTarget): Promise<void> {
    await this.locator(target).fill("");
  }

  public async focus(target: LocatorTarget): Promise<void> {
    await this.locator(target).focus();
  }

  public async check(target: LocatorTarget): Promise<void> {
    await this.locator(target).check();
  }

  public async uncheck(target: LocatorTarget): Promise<void> {
    await this.locator(target).uncheck();
  }

  public async selectRadio(target: LocatorTarget): Promise<void> {
    await this.check(target);
  }

  public async selectDropdown(target: LocatorTarget, option: SelectOptionInput): Promise<void> {
    if (typeof option === "number") {
      await this.locator(target).selectOption({ index: option });
      return;
    }

    if (typeof option === "string") {
      const trimmedOption = option.trim();
      await this.locator(target).selectOption([
        { label: trimmedOption },
        { value: trimmedOption }
      ]);
      return;
    }

    await this.locator(target).selectOption(option);
  }

  public async hover(target: LocatorTarget): Promise<void> {
    await this.locator(target).hover();
  }

  public async press(target: LocatorTarget, key: string): Promise<void> {
    await this.locator(target).press(key);
  }

  public async blur(target: LocatorTarget): Promise<void> {
    await this.locator(target).evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.blur();
      }
    });
  }

  public async uploadFile(target: LocatorTarget, filePath: string): Promise<void> {
    await this.locator(target).setInputFiles(filePath);
  }

  public async dragAndDrop(source: LocatorTarget, destination: LocatorTarget): Promise<void> {
    await this.locator(source).dragTo(this.locator(destination));
  }

  public async setCheckbox(target: LocatorTarget, checked: boolean): Promise<void> {
    if (checked) {
      await this.check(target);
      return;
    }

    await this.uncheck(target);
  }

  public async waitForVisible(target: LocatorTarget, timeout?: number): Promise<void> {
    await this.locator(target).waitFor({ state: "visible", timeout });
  }

  public async waitForHidden(target: LocatorTarget, timeout?: number): Promise<void> {
    await this.locator(target).waitFor({ state: "hidden", timeout });
  }

  public async getText(target: LocatorTarget): Promise<string> {
    return (await this.locator(target).textContent())?.trim() ?? "";
  }

  public async getValue(target: LocatorTarget): Promise<string> {
    return await this.locator(target).inputValue();
  }

  public async isVisible(target: LocatorTarget): Promise<boolean> {
    return await this.locator(target).isVisible();
  }

  public async isEnabled(target: LocatorTarget): Promise<boolean> {
    return await this.locator(target).isEnabled();
  }

  public async isChecked(target: LocatorTarget): Promise<boolean> {
    return await this.locator(target).isChecked();
  }

  public async perform(action: ElementActionName, target: LocatorTarget, options: ElementActionOptions = {}): Promise<void> {
    switch (action) {
      case "click":
        await this.click(target, { timeout: options.timeout, force: options.force });
        return;
      case "doubleClick":
        await this.doubleClick(target, { timeout: options.timeout, force: options.force });
        return;
      case "rightClick":
        await this.rightClick(target, { timeout: options.timeout, force: options.force });
        return;
      case "fill":
        await this.fill(target, options.value ?? "");
        return;
      case "type":
        await this.type(target, options.value ?? "");
        return;
      case "append":
        await this.append(target, options.value ?? "");
        return;
      case "check":
        await this.check(target);
        return;
      case "uncheck":
        await this.uncheck(target);
        return;
      case "setCheckbox":
        if (options.checked === undefined) {
          throw new Error("Checkbox state action requires a checked value.");
        }
        await this.setCheckbox(target, options.checked);
        return;
      case "radio":
        await this.selectRadio(target);
        return;
      case "select":
        if (options.option === undefined) {
          throw new Error("Dropdown selection requires an option value.");
        }
        await this.selectDropdown(target, options.option);
        return;
      case "hover":
        await this.hover(target);
        return;
      case "press":
        if (!options.pressKey) {
          throw new Error("Keyboard action requires a pressKey value.");
        }
        await this.press(target, options.pressKey);
        return;
      case "clear":
        await this.clear(target);
        return;
      case "focus":
        await this.focus(target);
        return;
      case "blur":
        await this.blur(target);
        return;
      case "upload":
        if (!options.filePath) {
          throw new Error("File upload action requires a filePath value.");
        }
        await this.uploadFile(target, options.filePath);
        return;
      case "dragAndDrop":
        if (!options.destination) {
          throw new Error("Drag and drop action requires a destination locator.");
        }
        await this.dragAndDrop(target, options.destination);
        return;
      default:
        throw new Error(`Unsupported action requested: ${action}`);
    }
  }

  private isLocator(target: LocatorTarget): target is Locator {
    return typeof target === "object" && target !== null;
  }

  private escapeAttributeValue(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
}

import { computed, ComputedRef, Ref, unref } from 'vue';

/** A string rendered as markdown by `vue-markdown-render`, with its `options` and `plugins`. */
export class MdString extends String {
  plugins?: any[];
  options?: any;

  constructor(value: string, options?: any, plugins?: any[]) {
    super(value);
    this.plugins = plugins;
    this.options = options;
  }
}

/**
 * A string rendered as HTML: it is set as the `innerHTML` of a `div`. It is not sanitized, so a string holding text
 * from a user or a server is escaped or sanitized before it is wrapped.
 */
export class HtmlString extends String {}

/**
 * A component to render content with: an HTML element or a registered component by its name, with its props. It has
 * no HTML content; HTML is an `HtmlString`.
 */
export interface SimpleComponentDef {
  componentName: string;
  /** The props of the component. `innerHTML` is not one: the component drops it. */
  componentProps?: Record<string, unknown> & { innerHTML?: never };
}

export type ClassType = string | string[] | Record<string, boolean>;
export type ClassTypes = ClassType | ClassType[];

export type RenderContentNonCallable = string | MdString | HtmlString | SimpleComponentDef;
export type RenderContentCallable = () => RenderContentNonCallable;
/** Content in one of four forms - plain text, markdown, HTML or a component - or a function answering one. */
export type RenderContent = RenderContentNonCallable | RenderContentCallable;
/** `RenderContent`, or a reference to it. */
export type RenderContentRef = RenderContent | Ref<RenderContent>;

/** True where `content` names a component to render it with. */
export function isSimpleComponentDef(content?: RenderContentRef): content is SimpleComponentDef {
  const value = unref(content);
  // typeof null is 'object', and `in` throws on null
  return typeof value === 'object' && value !== null && 'componentName' in value;
}

/** True where `value` is content in one of the four forms: a string, an `MdString`, an `HtmlString` or a component. */
export function isRenderContent(value: unknown): value is RenderContentNonCallable {
  return typeof value === 'string' || value instanceof String || isSimpleComponentDef(value as RenderContentRef);
}

// read last for '&amp;', so '&amp;lt;' reads as '&lt;'
const htmlEntities: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
  '&amp;': '&',
};

/**
 * The text of `content` where only text is taken, such as an `aria-label`: a string and an `MdString` as written, an
 * `HtmlString` without its tags and with `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;` and `&nbsp;` read, and a
 * component as `''`.
 */
export function renderContentText(content: RenderContentNonCallable): string {
  if (content instanceof HtmlString) {
    return Object.entries(htmlEntities).reduce(
      (text, [entity, char]) => text.replaceAll(entity, char),
      content.toString().replace(/<[^>]*>/g, ''),
    );
  }
  return isSimpleComponentDef(content) ? '' : content.toString();
}

/** True where `content` is a function answering the content. */
export function isCallableFunction(content?: RenderContentRef): content is RenderContentCallable {
  return typeof unref(content) === 'function';
}

/** Which of the four forms content takes. */
export type RenderContentKind = 'string' | 'md' | 'html' | 'component';

/**
 * Content with the CSS classes it is rendered with, described as what renders it: `componentName`, its
 * `componentBindings`, its `componentBody` and its `extraClasses`. `componentName` is `'template'` for plain text,
 * `'vue-markdown'` for markdown, `'html'` for an `HtmlString` and the component's name for a `SimpleComponentDef`;
 * `componentBody` is the text of plain text and the HTML of an `HtmlString`.
 *
 * `MessagesWidget` renders it, and so does any component that reads those four members. A reference or a function as
 * the content is read on every render, so what it answers reaches the screen without the value being built again.
 */
export class RenderableValue {
  // an ordinary property rather than a #private one: a value held in reactive state is read through its proxy, and a
  // #private member read through a proxy throws. The proxy also unwraps the ref, hence unref on read
  private readonly kindRef: ComputedRef<RenderContentKind>;

  constructor(
    private readonly content: RenderContentRef = '',
    public classes: ClassTypes = '',
  ) {
    this.kindRef = computed(() => {
      const resolved = this.resolvedText;
      if (resolved instanceof MdString) return 'md';
      if (resolved instanceof HtmlString) return 'html';
      if (isSimpleComponentDef(resolved)) return 'component';
      return 'string';
    });
  }

  /** The content as it reads now: a reference unwrapped and a function called. */
  get resolvedText(): RenderContentNonCallable {
    const content = unref(this.content);
    return isCallableFunction(content) ? content() : content;
  }

  /** Which of the four forms the content takes now. */
  get kind(): RenderContentKind {
    return unref(this.kindRef);
  }

  get componentName(): string {
    switch (this.kind) {
      case 'md':
        return 'vue-markdown';
      case 'html':
        return 'html';
      case 'component':
        return (this.resolvedText as SimpleComponentDef).componentName;
      default:
        return 'template';
    }
  }

  get componentBindings(): Record<string, any> {
    switch (this.kind) {
      case 'md': {
        const text = this.resolvedText as MdString;
        return { source: text.toString(), options: text.options, plugins: text.plugins };
      }
      case 'component': {
        // the props never set inner HTML: HTML content is an HtmlString
        const props: Record<string, unknown> = { ...(this.resolvedText as SimpleComponentDef).componentProps };
        delete props.innerHTML;
        return props;
      }
      default:
        return {};
    }
  }

  get componentBody(): string {
    switch (this.kind) {
      case 'md':
      case 'component':
        return '';
      default:
        return this.resolvedText.toString();
    }
  }

  get extraClasses(): ClassTypes {
    return this.classes;
  }
}

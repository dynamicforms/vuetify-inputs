// @vitest-environment node
import { Field } from '@dynamicforms/vue-forms';
import { renderToString } from '@vue/server-renderer';
import { de } from 'date-fns/locale/de';
import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, h, type Component } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import { DfDateTime, DfImage, DfRtfEditor, DfSelect, DynamicFormsInputs, type VuetifyInputsSettings } from '@/index';

function render(component: Component, props: Record<string, unknown>, settings: VuetifyInputsSettings = {}) {
  const app = createSSRApp({ render: () => h(component, props) });
  app.use(createVuetify({ ssr: true, components, directives }));
  app.use(DynamicFormsInputs, settings);
  return renderToString(app);
}

const comms = { upload: async () => 'id', delete: async () => {}, touch: async () => {} };

describe('server-side rendering', () => {
  it('renders a select as a text field holding the chosen choice', async () => {
    const choices = [
      { id: 1, text: 'One' },
      { id: 2, text: 'Two' },
    ];
    const html = await render(DfSelect, { label: 'Number', choices, control: new Field({ value: 2 }) });

    expect(html).toContain('Number');
    expect(html).toContain('value="Two"');
  });

  it('does not call fetchChoices, and leaves the value as it is', async () => {
    const fetchChoices = vi.fn(async () => {
      throw new TypeError('Failed to parse URL from /api/choices');
    });
    const control = new Field({ value: 7 });

    await render(DfSelect, { label: 'Remote', fetchChoices, control, allowNull: false });

    expect(fetchChoices).not.toHaveBeenCalled();
    expect(control.value).toBe(7);
  });

  it("renders the rich-text editor's value as text", async () => {
    const html = await render(DfRtfEditor, { label: 'Body', modelValue: '<p>Hello <b>world</b></p>' });

    expect(html).toContain('Hello world');
  });

  it('formats a date with the dateTimeLocale setting of the app', async () => {
    const html = await render(
      DfDateTime,
      { label: 'When', inputType: 'date', modelValue: '2024-03-10' },
      { dateTimeLocale: de },
    );

    expect(html).toContain('10.03.2024');
  });

  it("translates with each app's translate setting, also for apps rendered at once", async () => {
    const app = (lang: string) =>
      render(DfImage, { label: 'Photo', comms }, { translate: (key) => `[${lang}] ${key}` });

    const [sl, en] = await Promise.all([app('sl'), app('en')]);

    expect(sl).toContain('[sl] ImageDropHint');
    expect(sl).not.toContain('[en]');
    expect(en).toContain('[en] ImageDropHint');
  });
});

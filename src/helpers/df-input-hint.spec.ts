import { MessagesWidget, ValidationError, ValidationErrorRenderContent } from '@dynamicforms/vue-forms';
import { mount, VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DfInputHint from './df-input-hint.vue';

const messagesWidgetStub = {
  template: '<div class="messages-widget">{{ message }}</div>',
  props: ['message', 'classes'],
};

const createWrapper = (props: Record<string, any>) => {
  return mount(DfInputHint, {
    props,
    global: {
      stubs: {
        MessagesWidget: messagesWidgetStub,
      },
    },
  });
};

const expectMessagesWidget = (wrapper: VueWrapper, expectedMessage: any, expectedClasses: string) => {
  const messagesWidget = wrapper.findComponent(MessagesWidget);
  expect(messagesWidget.props('message')).toEqual(expectedMessage);
  expect(messagesWidget.props('classes')).toBe(expectedClasses);
};

describe('DfInputHint', () => {
  it('renders MessagesWidget component', () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Test message',
      },
      global: {
        stubs: {
          MessagesWidget: true,
        },
      },
    });

    expect(wrapper.findComponent(MessagesWidget).exists()).toBe(true);
  });

  it('displays message when there are no errors', () => {
    const wrapper = createWrapper({ message: 'Helper text', errors: undefined });
    expectMessagesWidget(wrapper, 'Helper text', '');
  });

  it('displays error when errors is a non-empty string', () => {
    const wrapper = createWrapper({ message: 'Helper text', errors: 'This field is required' });
    expectMessagesWidget(wrapper, 'This field is required', 'text-error');
  });

  it('displays message when errors is an empty string', () => {
    const wrapper = createWrapper({ message: 'Helper text', errors: '' });
    expectMessagesWidget(wrapper, 'Helper text', '');
  });

  it('displays message when errors is a whitespace-only string', () => {
    const wrapper = createWrapper({ message: 'Helper text', errors: '   ' });
    expectMessagesWidget(wrapper, 'Helper text', '');
  });

  it('displays errors when errors is an array of ValidationError objects', () => {
    const validationErrors: ValidationError[] = [
      new ValidationErrorRenderContent('Field is required'),
      new ValidationErrorRenderContent('Invalid format'),
    ];
    const wrapper = createWrapper({ message: 'Helper text', errors: validationErrors });
    expectMessagesWidget(wrapper, validationErrors, 'text-error');
  });

  it('displays message when errors is an empty array', () => {
    const wrapper = createWrapper({ message: 'Helper text', errors: [] });
    expectMessagesWidget(wrapper, 'Helper text', '');
  });

  it('uses custom errorClasses', () => {
    const wrapper = createWrapper({
      message: 'Helper text',
      errors: 'Error message',
      errorClasses: 'custom-error-class',
    });
    expectMessagesWidget(wrapper, 'Error message', 'custom-error-class');
  });

  it('uses custom messageClasses', () => {
    const wrapper = createWrapper({
      message: 'Helper text',
      errors: undefined,
      messageClasses: 'custom-message-class',
    });
    expectMessagesWidget(wrapper, 'Helper text', 'custom-message-class');
  });

  it('displays only message when errors is not defined', () => {
    const wrapper = createWrapper({ message: 'This is a hint' });
    expectMessagesWidget(wrapper, 'This is a hint', '');
  });

  it('correctly reacts to changes from message to error', async () => {
    const wrapper = createWrapper({ message: 'Initial message', errors: undefined });
    expectMessagesWidget(wrapper, 'Initial message', '');

    await wrapper.setProps({ errors: 'Error occurred' });
    expectMessagesWidget(wrapper, 'Error occurred', 'text-error');
  });

  it('correctly reacts to changes from error to message', async () => {
    const wrapper = createWrapper({ message: 'Helper text', errors: 'Initial error' });
    expectMessagesWidget(wrapper, 'Initial error', 'text-error');

    await wrapper.setProps({ errors: '' });
    expectMessagesWidget(wrapper, 'Helper text', '');
  });

  it('handles undefined for both props values', () => {
    const wrapper = createWrapper({ message: undefined, errors: undefined });
    expectMessagesWidget(wrapper, '', '');
  });

  it('displays complex ValidationError object', () => {
    const complexError = new ValidationErrorRenderContent('Complex error with details');
    const wrapper = createWrapper({ message: 'Helper text', errors: [complexError] });
    expectMessagesWidget(wrapper, [complexError], 'text-error');
  });
});

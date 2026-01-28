import { MessagesWidget, ValidationError, ValidationErrorRenderContent } from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DfInputHint from './df-input-hint.vue';

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
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Helper text',
        errors: undefined,
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toBe('Helper text');
    expect(messagesWidget.props('classes')).toBe('');
  });

  it('displays error when errors is a non-empty string', () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Helper text',
        errors: 'This field is required',
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toBe('This field is required');
    expect(messagesWidget.props('classes')).toBe('text-error');
  });

  it('displays message when errors is an empty string', () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Helper text',
        errors: '',
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toBe('Helper text');
    expect(messagesWidget.props('classes')).toBe('');
  });

  it('displays message when errors is a whitespace-only string', () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Helper text',
        errors: '   ',
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    // Empty string after trim() -> no error
    expect(messagesWidget.props('message')).toBe('Helper text');
    expect(messagesWidget.props('classes')).toBe('');
  });

  it('displays errors when errors is an array of ValidationError objects', () => {
    const validationErrors: ValidationError[] = [
      new ValidationErrorRenderContent('Field is required'),
      new ValidationErrorRenderContent('Invalid format'),
    ];

    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Helper text',
        errors: validationErrors,
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toEqual(validationErrors);
    expect(messagesWidget.props('classes')).toBe('text-error');
  });

  it('displays message when errors is an empty array', () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Helper text',
        errors: [],
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toBe('Helper text');
    expect(messagesWidget.props('classes')).toBe('');
  });

  it('uses custom errorClasses', () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Helper text',
        errors: 'Error message',
        errorClasses: 'custom-error-class',
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('classes')).toBe('custom-error-class');
  });

  it('uses custom messageClasses', () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Helper text',
        errors: undefined,
        messageClasses: 'custom-message-class',
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('classes')).toBe('custom-message-class');
  });

  it('displays only message when errors is not defined', () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'This is a hint',
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toBe('This is a hint');
    expect(messagesWidget.props('classes')).toBe('');
  });

  it('correctly reacts to changes from message to error', async () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Initial message',
        errors: undefined,
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    let messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toBe('Initial message');
    expect(messagesWidget.props('classes')).toBe('');

    // Add error
    await wrapper.setProps({ errors: 'Error occurred' });

    messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toBe('Error occurred');
    expect(messagesWidget.props('classes')).toBe('text-error');
  });

  it('correctly reacts to changes from error to message', async () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Helper text',
        errors: 'Initial error',
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    let messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toBe('Initial error');
    expect(messagesWidget.props('classes')).toBe('text-error');

    // Remove error
    await wrapper.setProps({ errors: '' });

    messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toBe('Helper text');
    expect(messagesWidget.props('classes')).toBe('');
  });

  it('handles undefined for both props values', () => {
    const wrapper = mount(DfInputHint, {
      props: {
        message: undefined,
        errors: undefined,
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toBe('');
    expect(messagesWidget.props('classes')).toBe('');
  });

  it('displays complex ValidationError object', () => {
    const complexError = new ValidationErrorRenderContent('Complex error with details');

    const wrapper = mount(DfInputHint, {
      props: {
        message: 'Helper text',
        errors: [complexError],
      },
      global: {
        stubs: {
          MessagesWidget: {
            template: '<div class="messages-widget">{{ message }}</div>',
            props: ['message', 'classes'],
          },
        },
      },
    });

    const messagesWidget = wrapper.findComponent(MessagesWidget);
    expect(messagesWidget.props('message')).toEqual([complexError]);
    expect(messagesWidget.props('classes')).toBe('text-error');
  });
});

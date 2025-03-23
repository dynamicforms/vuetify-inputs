# df-select Component

df-select component supports single or multiple choice, along with "tags" (custom new value entry) and dynamic 
option loading.

## Basic Usage

Basic demo with a fixed options list:

<select-basic/>

## Advanced Features

df-select also supports dynamic options loading, icons:

<select-ajax/>

## Integration with DynamicForms

But the main purpose of df-select is its integration with `@dynamicforms/vue-forms`. The demo below is the same as in 
the vue-forms library, we just added the df-select component as well to show it off ;)

<select-form/>

<script setup>
import SelectBasic from '../components/select-basic.vue';
import SelectAjax from '../components/select-ajax.vue';
import SelectForm from '../components/select-form.vue';
</script>

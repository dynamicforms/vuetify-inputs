Immediate todo

- documentation is inconsistent: every field documents common properties, some don't document them at all.
  - an additional page needs to be added documenting the common props and events. the inputs themselves need to then
    link to that page.

- df-list (basically a table-editing field) - requires the new table component
- df-select should be able to render as checkbox group or radio group based on a threshold value provided.
  this should provide an alternate representation of (multi) selections. The threshold would be null (disabled) by 
  default. when provided, number of choices ABOVE the provided parameter would result in df-select rendering as select,
  otherwise the component would render as the new radio / check group. 
  
  Likely an additional parameter would be needed specifying the layout (wrapping horizontal, vertical)

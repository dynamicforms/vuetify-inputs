Immediate todo

- support serialization format for datetime component
- df-list (basically a table-editing field) - requires the new table component
- df-select should be able to render as checkbox group or radio group based on a threshold value provided.
  this should provide an alternate representation of (multi) selections. The threshold would be null (disabled) by 
  default. when provided, number of choices ABOVE the provided parameter would result in df-select rendering as select,
  otherwise the component would render as the new radio / check group. 
  
  Likely an additional parameter would be needed specifying the layout (wrapping horizontal, vertical)
- df-actions
  - vertical layout
  - icon position
  - icon size
  
Immediate todo

- support serialization format for datetime component
- df-list (basically a table-editing field) - requires the new table component
- df-select should be able to render as checkbox group or radio group based on a threshold value provided.
  this should provide an alternate representation of (multi) selections. The threshold would be null (disabled) by 
  default. when provided, number of choices ABOVE the provided parameter would result in df-select rendering as select,
  otherwise the component would render as the new radio / check group. 
- time component manual entry the smart way: 153 meand 1:53, 123 means 12:30(and waiting for possible minute entry)
- date component manual entry the smart way: 0105 meand 1.5.(current year), etc
 
  Likely an additional parameter would be needed specifying the layout (wrapping horizontal, vertical)
- df-actions
  - vertical layout
  - icon position
  - icon size
  
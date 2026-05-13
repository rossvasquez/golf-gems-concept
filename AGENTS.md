# IAWA Map POC Agents File

## Purpose

This is a POC application intended to achieve the following.

- Initialize an absolutely positioned mapbox element that takes up the screen sans the header.
- Take a hardcoded array of multipolygon geojson and step through each item on the map
- Stepping refers to either scrolling (scrolljacked stepping), selecting a step from a chique steps bar at the top of the map, or using arrow keys to step to each location
- At each step we should use the geojson to render a polygon on the map around the coords of each polygon in the multipolygon
- We should display the data from the properties object on a card at each location
- Each step should zoom out ("fly") and zoom back in to the new location cleanly
- Each step should render it's geo data and card only when that step is active, and unmount it if other steps are visited

## Stack

- This is a modern static React/TypeScript application powered by Vite.
- You should always utilize TailwindCSS.
- Zustand has been imported for state management. Utilize elegant state orchestration over polluting components with useState.
- ShadCN has been initialized with the Sera preset. Utilize Playfair Display and Noto Sans as well as Lucide Icons. You may publish components with `npx shadcn@latest add {lowercase-component}`. Here is a list of available components:
  - Accordion
  - Alert
  - Alert Dialog
  - Aspect Ratio
  - Avatar
  - Badge
  - Breadcrumb
  - Button
  - Button Group
  - Calendar
  - Card
  - Carousel
  - Chart
  - Checkbox
  - Collapsible
  - Combobox
  - Command
  - Context Menu
  - Data Table
  - Date Picker
  - Dialog
  - Direction
  - Drawer
  - Dropdown Menu
  - Empty
  - Field
  - Hover Card
  - Input
  - Input Group
  - Input OTP
  - Item
  - Kbd
  - Label
  - Menubar
  - Native Select
  - Navigation Menu
  - Pagination
  - Popover
  - Progress
  - Radio Group
  - Resizable
  - Scroll Area
  - Select
  - Separator
  - Sheet
  - Sidebar
  - Skeleton
  - Slider
  - Sonner
  - Spinner
  - Switch
  - Table
  - Tabs
  - Textarea
  - Toast
  - Toggle
  - Toggle Group
  - Tooltip
  - Typography
- Mapbox is utilized for map display and app functionality. `mapbox-gl` has been initialized.

## Additional

- This app is golf themed, utilize tailwinds emerald to theme shadcn and app display
- Implement code in a minimal, elegant, human like way. If you need additional packages, don't hesitate to offer recommendations over going off the rails with custom implementations.

<!-- 9d46413c-14fa-4911-943a-f6b606a9462c 705e9f83-e1ef-4669-9421-637c73a7de28 -->
# Add Inline Category Creation with Radio Group

## Changes Overview

Replace the current category dropdown (`SelectCategory`) with a new radio group component that includes:

- Search input at the top
- Scrollable radio button list in the middle
- Add button at the bottom (toggles to input/submit/cancel on click)
- Auto-select newly created category

## Implementation Steps

### 1. Install/Setup Radio Group UI Component

Check if `radio-group` component exists in `/Users/pearel/projects/finance-manager/src/components/ui/`. If not, install it from shadcn/ui.

### 2. Create API Endpoint for Adding Categories

**File**: `/Users/pearel/projects/finance-manager/src/app/api/categories/route.ts`

- Add a `POST` handler to create new categories
- Accept `{ name: string }` in request body
- Associate category with current user (get userId from auth)
- Return created category

### 3. Create Category Mutation Hook

**File**: `/Users/pearel/projects/finance-manager/src/hooks/mutation/categories.ts` (new file)

- Create `useAddCategory` hook using `useMutation`
- Call POST `/api/categories`
- Invalidate `CATEGORIES` query on success (to refetch list)

### 4. Create New RadioGroupCategory Component

**File**: `/Users/pearel/projects/finance-manager/src/components/RadioGroupCategory.tsx` (new file)

- Accept `onChange`, `value` props (same interface as `SelectCategory`)
- State management:
  - `isAddingMode` - toggle between add button and input mode
  - `searchQuery` - filter categories by name
  - `newCategoryName` - input value for new category
- Layout structure:
  ```tsx
  <div className="border rounded-md p-3 space-y-3 max-h-[300px] flex flex-col">
    {/* Search input */}
    <Input placeholder="Search categories..." />
    
    {/* Scrollable radio group */}
    <ScrollArea className="flex-1">
      <RadioGroup>
        {filteredCategories.map(cat => (
          <RadioGroupItem key={cat.id} value={cat.id} />
        ))}
      </RadioGroup>
    </ScrollArea>
    
    {/* Add button OR Input mode */}
    {!isAddingMode ? (
      <Button onClick={() => setIsAddingMode(true)}>+ Add Category</Button>
    ) : (
      <div className="flex gap-2">
        <Input value={newCategoryName} onChange={...} />
        <Button onClick={handleSubmit}>Save</Button>
        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
      </div>
    )}
  </div>
  ```

- Handle category creation:
  - Use `useAddCategory` mutation
  - On success: auto-select new category (`onChange(newCategory.id)`)
  - Reset to button mode

### 5. Update Add Transaction Page

**File**: `/Users/pearel/projects/finance-manager/src/app/dashboard/@addTransaction/page.tsx`

```tsx
// Line 58-62: Replace SelectCategory with RadioGroupCategory
<Controller
  control={control}
  name="category"
  render={({ field }) => <RadioGroupCategory {...field} />}
/>
```

### 6. Create Category Service Function

**File**: `/Users/pearel/projects/finance-manager/src/services/category.ts`

- Add `addCategory` function to POST to `/api/categories`

## Key Files to Modify

- `/Users/pearel/projects/finance-manager/src/app/api/categories/route.ts` - Add POST handler
- `/Users/pearel/projects/finance-manager/src/services/category.ts` - Add service function
- `/Users/pearel/projects/finance-manager/src/hooks/mutation/categories.ts` - New mutation hook
- `/Users/pearel/projects/finance-manager/src/components/RadioGroupCategory.tsx` - New component
- `/Users/pearel/projects/finance-manager/src/app/dashboard/@addTransaction/page.tsx` - Replace selector

### To-dos

- [x] Install/verify radio-group UI component from shadcn/ui
- [x] Add POST handler to /api/categories/route.ts for creating categories
- [x] Add addCategory function to services/category.ts
- [x] Create useAddCategory hook in hooks/mutation/categories.ts
- [x] Build RadioGroupCategory component with search, scrollable list, and inline add functionality
- [x] Replace SelectCategory with RadioGroupCategory in add transaction page

# API Specification (Supabase)

This document specifies the data interactions using the Supabase JavaScript Client.

## Overview
- **Base URL**: Managed by Supabase Client (`VITE_SUPABASE_URL`)
- **Authentication**:
  - Data access is controlled by RLS.
  - Login uses a **database RPC** (`pms_login`) against pre-issued users in `app_users`.
- **Client Library**: `@supabase/supabase-js`

## Endpoints

### 0. Auth (Pre-issued ID/Password)

#### Login
Validates user ID/password without exposing password hashes to the client.

- **Operation**: `RPC`
- **Function**: `pms_login(p_user_id, p_password)`
- **Query**:
  ```typescript
  const { data, error } = await supabase.rpc('pms_login', {
    p_user_id: userId,
    p_password: password,
  });

  // data: [] on failure, [{ user_id, user_group }] on success
  ```

### 1. Sites

#### Get All Sites (Dashboard)
Fetches all sites including their timeline and checklist items to calculate progress summaries.

- **Query**:
  ```typescript
  const { data, error } = await supabase
    .from('sites')
    .select(`
      id,
      name,
      timeline_items (status),
      checklist_items (checked)
    `);
  ```
- **Response**: Array of site objects with nested items.

#### Get Site Details
Fetches full details for a specific site, including all fields of timeline and checklist items.

- **Query**:
  ```typescript
  const { data, error } = await supabase
    .from('sites')
    .select(`
      *,
      timeline_items (*),
      checklist_items (*)
    `)
    .eq('id', siteId)
    .single();
  ```
- **Response**: Single site object with nested `timeline_items` and `checklist_items` arrays.

### 2. Timeline

#### Update Timeline Item Status
Updates the status of a specific timeline task.

- **Operation**: `UPDATE`
- **Table**: `timeline_items`
- **Parameters**:
  - `itemId` (ID of the item to update)
  - `updates` (Object containing fields to update, e.g., `{ status: 'completed' }`)
- **Query**:
  ```typescript
  const { data, error } = await supabase
    .from('timeline_items')
    .update(updates)
    .eq('id', itemId)
    .select();
  ```

### 3. Checklist

#### Update Checklist Item
Toggles the checked state of a checklist item.

- **Operation**: `UPDATE`
- **Table**: `checklist_items`
- **Parameters**:
  - `itemId` (ID of the item to update)
  - `checked` (Boolean)
- **Query**:
  ```typescript
  const { data, error } = await supabase
    .from('checklist_items')
    .update({ checked: isChecked })
    .eq('id', itemId)
    .select();
  ```

## Error Handling
- The Supabase client returns an `{ error }` object.
- If `error` is not null, throw or handle the error appropriately in the UI layer.

"use client";

import type { UserProfile, Task } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Users, Tag, Check, ChevronsUpDown } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';
import React from 'react';

export interface TaskFormData {
  title: string;
  description?: string;
  priority: Task['priority'];
  assigneeUids?: string[];
  dueDate?: string; // YYYY-MM-DD string
  tags?: string[]; // For simplicity, string array. Could be objects.
  dependentTaskTitles?: string[]; // For AI
}

interface TaskFormFieldsProps {
  form: UseFormReturn<TaskFormData>; // Use the specific form data type
  users: UserProfile[];
  allTasksForDependencies: Pick<Task, 'id' | 'title'>[]; // For dependent tasks selector
  isEditing?: boolean;
}

export function TaskFormFields({ form, users, allTasksForDependencies, isEditing = false }: TaskFormFieldsProps) {
  const { register, control, watch, setValue } = form;

  const selectedAssignees = watch('assigneeUids') || [];
  const selectedDependencies = watch('dependentTaskTitles') || [];

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} placeholder="e.g., Implement feature X" />
        {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} placeholder="Provide a detailed description of the task..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="priority">Priority</Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dueDate">Due Date</Label>
           <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : undefined)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Assignees</Label>
        <Controller
            name="assigneeUids"
            control={control}
            render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                            {selectedAssignees.length > 0
                                ? users.filter(user => selectedAssignees.includes(user.id)).map(user => user.name).join(', ')
                                : "Select assignees..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Search users..." />
                            <CommandList>
                                <CommandEmpty>No users found.</CommandEmpty>
                                <CommandGroup>
                                    {users.map((user) => (
                                        <CommandItem
                                            key={user.id}
                                            value={user.name}
                                            onSelect={() => {
                                                const currentSelection = field.value || [];
                                                const newSelection = currentSelection.includes(user.id)
                                                    ? currentSelection.filter(id => id !== user.id)
                                                    : [...currentSelection, user.id];
                                                field.onChange(newSelection);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    (field.value || []).includes(user.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {user.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        />
      </div>
       <div className="space-y-1">
        <Label>Dependent Tasks (for AI)</Label>
        <Controller
            name="dependentTaskTitles"
            control={control}
            render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                            {selectedDependencies.length > 0
                                ? selectedDependencies.join(', ')
                                : "Select dependent tasks..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Search tasks..." />
                            <CommandList>
                                <CommandEmpty>No tasks found.</CommandEmpty>
                                <CommandGroup>
                                    {allTasksForDependencies.map((taskDep) => (
                                        <CommandItem
                                            key={taskDep.id}
                                            value={taskDep.title}
                                            onSelect={() => {
                                                const currentSelection = field.value || [];
                                                const newSelection = currentSelection.includes(taskDep.title)
                                                    ? currentSelection.filter(title => title !== taskDep.title)
                                                    : [...currentSelection, taskDep.title];
                                                field.onChange(newSelection);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    (field.value || []).includes(taskDep.title) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {taskDep.title}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        />
      </div>
      {/* Tags field could be added here similar to assignees or dependencies if needed */}
    </div>
  );
}

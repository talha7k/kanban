
"use client";

import { useState, useEffect } from "react";
import type { Project, UserProfile, UserProjectRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addUserToProject, removeUserFromProject, updateProjectUserRole } from "@/lib/firebaseService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, X, Check, ChevronsUpDown, UserPlus, ShieldCheck, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface ManageProjectMembersDialogProps {
  project: Project;
  allUsers: UserProfile[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMembersUpdate: () => Promise<void> | void;
}

export function ManageProjectMembersDialog({
  project,
  allUsers,
  isOpen,
  onOpenChange,
  onMembersUpdate,
}: ManageProjectMembersDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);

  const projectMemberIds = project.memberIds || [];
  const projectMembers = allUsers.filter(user => projectMemberIds.includes(user.id) && user.id !== project.ownerId);
  const nonMemberUsers = allUsers.filter(user => !projectMemberIds.includes(user.id) && user.id !== project.ownerId);

  const handleAddMember = async () => {
    if (!selectedUserToAdd) {
      toast({ variant: "destructive", title: "No user selected", description: "Please select a user to add." });
      return;
    }
    setIsSubmitting(true);
    try {
      await addUserToProject(project.id, selectedUserToAdd.id); // Default role 'member' is set by service
      toast({ title: "Member Added", description: `${selectedUserToAdd.name} has been added to the project as a member.` });
      setSelectedUserToAdd(null);
      setSearchTerm("");
      await onMembersUpdate();
    } catch (error) {
      console.error("Error adding member:", error);
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Could not add member." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userIdToRemove: string) => {
     if (userIdToRemove === project.ownerId) {
        toast({ variant: "destructive", title: "Cannot Remove Owner", description: "The project owner cannot be removed." });
        return;
    }
    setIsSubmitting(true);
    try {
      const userToRemove = allUsers.find(u => u.id === userIdToRemove);
      await removeUserFromProject(project.id, userIdToRemove);
      toast({ title: "Member Removed", description: `${userToRemove?.name || 'User'} has been removed from the project.` });
      await onMembersUpdate();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "Could not remove member." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserProjectRole) => {
    setIsSubmitting(true);
    try {
        await updateProjectUserRole(project.id, userId, newRole);
        toast({ title: "Role Updated", description: `Role for user has been updated to ${newRole}.`});
        await onMembersUpdate();
    } catch (error) {
        console.error("Error updating role:", error);
        toast({ variant: "destructive", title: "Error Updating Role", description: error instanceof Error ? error.message : "Could not update role." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const ownerProfile = allUsers.find(u => u.id === project.ownerId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5" />Manage Members & Roles: {project.name}</DialogTitle>
          <DialogDescription>Add/remove members and assign project-specific roles.</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Project Owner</h3>
          {ownerProfile && (
            <div className="flex items-center justify-between space-x-3 p-2 rounded-md bg-muted/30">
                 <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={ownerProfile.avatarUrl} alt={ownerProfile.name} data-ai-hint="profile avatar small"/>
                        <AvatarFallback>{ownerProfile.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium text-foreground">{ownerProfile.name}</p>
                        <p className="text-xs text-muted-foreground">{ownerProfile.email}</p>
                    </div>
                 </div>
                 <Badge variant="outline" className="border-primary text-primary"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Owner</Badge>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-semibold mb-2 mt-3 text-muted-foreground">Current Members ({projectMembers.length})</h3>
          <ScrollArea className="flex-grow border rounded-md mb-4">
            <div className="p-2 space-y-1">
              {projectMembers.length > 0 ? (
                projectMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50">
                    <div className="flex items-center space-x-2 flex-1">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="profile avatar small" />
                        <AvatarFallback>{member.name?.substring(0, 1).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Select
                            value={project.memberRoles?.[member.id] || 'member'}
                            onValueChange={(newRole: UserProjectRole) => handleRoleChange(member.id, newRole)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger className="h-8 w-[100px] text-xs">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member" className="text-xs">Member</SelectItem>
                                <SelectItem value="manager" className="text-xs">Manager</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={isSubmitting}
                            aria-label={`Remove ${member.name}`}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-2 text-center">No other members added yet.</p>
              )}
            </div>
          </ScrollArea>

          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Add New Member</h3>
          <div className="flex items-center space-x-2">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between flex-1"
                    disabled={isSubmitting || nonMemberUsers.length === 0}
                    >
                    {selectedUserToAdd
                        ? selectedUserToAdd.name
                        : nonMemberUsers.length === 0 ? "No users to add" : "Select user..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                    <CommandInput
                        placeholder="Search users..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList>
                        <CommandEmpty>No user found.</CommandEmpty>
                        <CommandGroup>
                        {nonMemberUsers
                            .filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((user) => (
                            <CommandItem
                                key={user.id}
                                value={user.name}
                                onSelect={(currentValue) => {
                                    const userFound = nonMemberUsers.find(u => u.name.toLowerCase() === currentValue.toLowerCase());
                                    setSelectedUserToAdd(userFound || null);
                                    setOpenCombobox(false);
                                    setSearchTerm("");
                                }}
                            >
                                <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedUserToAdd?.id === user.id ? "opacity-100" : "opacity-0"
                                )}
                                />
                                <div className="flex items-center space-x-2">
                                     <Avatar className="h-6 w-6">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile small"/>
                                        <AvatarFallback>{user.name?.substring(0,1).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span>{user.name} ({user.email})</span>
                                </div>
                            </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <Button onClick={handleAddMember} disabled={!selectedUserToAdd || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Add
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-auto pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

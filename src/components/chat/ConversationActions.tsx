
import React, { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Archive, 
  Trash2, 
  CheckCircle, 
  Undo2
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  closeConversation, 
  archiveConversation, 
  softDeleteConversation, 
  reopenConversation 
} from "@/services/chatService";
import { ChatConversation } from "@/services/chatService";
import { ChatRatingDialog } from "./ChatRatingDialog";

interface ConversationActionsProps {
  conversation: ChatConversation;
  isAdmin: boolean;
  onActionComplete: () => void;
}

export const ConversationActions: React.FC<ConversationActionsProps> = ({
  conversation,
  isAdmin,
  onActionComplete
}) => {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCloseConversation = async () => {
    setIsProcessing(true);
    await closeConversation(conversation.id);
    setIsProcessing(false);
    onActionComplete();
    
    // Solo mostramos el diálogo de valoración si es un cliente
    if (!isAdmin) {
      setShowRatingDialog(true);
    }
  };

  const handleArchiveConversation = async () => {
    setIsProcessing(true);
    await archiveConversation(conversation.id);
    setIsProcessing(false);
    onActionComplete();
  };

  const handleDeleteConversation = async () => {
    setIsProcessing(true);
    await softDeleteConversation(conversation.id, isAdmin);
    setIsProcessing(false);
    onActionComplete();
    setShowDeleteAlert(false);
  };

  const handleReopenConversation = async () => {
    setIsProcessing(true);
    await reopenConversation(conversation.id);
    setIsProcessing(false);
    onActionComplete();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {conversation.status === 'active' ? (
            <>
              <DropdownMenuItem 
                onClick={handleCloseConversation}
                disabled={isProcessing}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Finalizar consulta</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={handleArchiveConversation}
                disabled={isProcessing}
              >
                <Archive className="mr-2 h-4 w-4" />
                <span>Archivar</span>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem 
              onClick={handleReopenConversation}
              disabled={isProcessing}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              <span>Reabrir consulta</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowDeleteAlert(true)}
            disabled={isProcessing}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la conversación de tu lista. 
              {isAdmin 
                ? " La conversación seguirá siendo visible para el cliente."
                : " La conversación seguirá siendo visible para el soporte."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConversation}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo para valoración */}
      <ChatRatingDialog 
        conversationId={conversation.id}
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
      />
    </>
  );
};

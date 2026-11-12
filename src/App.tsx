import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  buildUserProfile,
  logoutUser,
  validateCorporateDomain,
  testFirestoreConnection,
  subscribeToCloudTickets,
  saveCloudTicket,
  subscribeToCloudComments,
  addCloudComment,
  saveCloudNotification,
  subscribeToCloudConfig,
  saveCloudConfig,
  assignTicketSafely,
  recordAuditLog,
  subscribeToEquipment,
  saveCloudEquipment,
  deleteCloudEquipment,
  subscribeToEquipmentMovements,
  saveCloudEquipmentMovement,
  subscribeToDeliveryTerms,
  saveCloudDeliveryTerm,
} from './lib/firebase';
import {
  CorporateConfig,
  HelpdeskNotification,
  Ticket,
  TicketComment,
  TicketPriority,
  TicketStatus,
  UserProfile,
  Equipment,
  EquipmentMovement,
  DeliveryTerm,
  GoogleAppsScriptSyncConfig,
} from './types';
import {
  addStoredComment,
  getCachedUser,
  getStoredComments,
  getStoredConfig,
  getStoredTickets,
  saveCachedUser,
  saveStoredConfig,
  saveStoredTickets,
  getStoredEquipment,
  saveStoredEquipment,
  getStoredMovements,
  saveStoredMovements,
  getStoredDeliveryTerms,
  saveStoredDeliveryTerms,
  getStoredGasConfig,
  saveStoredGasConfig,
} from './lib/storage';
import {
  clearAllNotifications,
  createNotification,
  getStoredNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './lib/notifications';
import { realtimeSync } from './lib/realtimeSync';
import { Sidebar, AppViewMode } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { TicketList } from './components/TicketList';
import { TicketKanban } from './components/TicketKanban';
import { DashboardStats } from './components/DashboardStats';
import { AuditLogsViewer } from './components/AuditLogsViewer';
import { TechInventoryView } from './components/inventory/TechInventoryView';
import { TicketDetailModal } from './components/TicketDetailModal';
import { NewTicketModal } from './components/NewTicketModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { UserManualModal } from './components/UserManualModal';
import { ToastAlert } from './components/ToastAlert';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { useTheme } from './context/ThemeContext';
import { logger } from './lib/monitoring';

export default function App() {
  const { theme } = useTheme();
  const [config, setConfig] = useState<CorporateConfig>(() => getStoredConfig());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCachedUser());
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [tickets, setTickets] = useState<Ticket[]>(() => getStoredTickets());
  const [equipments, setEquipments] = useState<Equipment[]>(() => getStoredEquipment());
  const [movements, setMovements] = useState<EquipmentMovement[]>(() => getStoredMovements());
  const [deliveryTerms, setDeliveryTerms] = useState<DeliveryTerm[]>(() => getStoredDeliveryTerms());
  const [gasConfig, setGasConfig] = useState<GoogleAppsScriptSyncConfig>(() => getStoredGasConfig());
  const [notifications, setNotifications] = useState<HelpdeskNotification[]>(() => getStoredNotifications());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [currentComments, setCurrentComments] = useState<TicketComment[]>([]);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualInitialMode, setManualInitialMode] = useState<'user' | 'admin'>('user');
  const [viewMode, setViewMode] = useState<AppViewMode>('list');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Floating notifications & modal preview
  const [activeToast, setActiveToast] = useState<HelpdeskNotification | null>(null);
  const [previewEmailNotif, setPreviewEmailNotif] = useState<HelpdeskNotification | null>(null);

  // Verify Firestore connection on mount
  useEffect(() => {
    testFirestoreConnection().catch((err) => {
      logger.error('Falha de checagem no Firestore', err);
    });
  }, []);

  // Real-time Cloud Config (Domains, SLA & Role Assignments)
  useEffect(() => {
    const unsubscribe = subscribeToCloudConfig((cloudConfig) => {
      if (cloudConfig && cloudConfig.roleAssignments) {
        setConfig((prev) => {
          const merged = { ...prev, ...cloudConfig };
          saveStoredConfig(merged);
          return merged;
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Cross-tab real-time event sync via BroadcastChannel
  useEffect(() => {
    const unsubscribeSync = realtimeSync.subscribe((event) => {
      if (event.type === 'TICKET_CREATED') {
        setTickets((prev) => {
          const exists = prev.some((t) => t.id === event.ticket.id);
          if (exists) return prev;
          const updated = [event.ticket, ...prev];
          saveStoredTickets(updated);
          return updated;
        });
      } else if (event.type === 'TICKET_UPDATED') {
        setTickets((prev) => {
          const updated = prev.map((t) => (t.id === event.ticket.id ? event.ticket : t));
          saveStoredTickets(updated);
          return updated;
        });
        setSelectedTicket((prevSelected) => {
          if (prevSelected && prevSelected.id === event.ticket.id) {
            return event.ticket;
          }
          return prevSelected;
        });
      } else if (event.type === 'COMMENT_ADDED') {
        setSelectedTicket((prevSelected) => {
          if (prevSelected && prevSelected.id === event.ticketId) {
            setCurrentComments((prevComments) => {
              const exists = prevComments.some((c) => c.id === event.comment.id);
              if (exists) return prevComments;
              return [...prevComments, event.comment];
            });
          }
          return prevSelected;
        });
      } else if (event.type === 'EQUIPMENT_CREATED') {
        setEquipments((prev) => {
          const exists = prev.some((e) => e.id === event.equipment.id);
          if (exists) return prev;
          const updated = [event.equipment, ...prev];
          saveStoredEquipment(updated);
          return updated;
        });
      } else if (event.type === 'EQUIPMENT_UPDATED') {
        setEquipments((prev) => {
          const updated = prev.map((e) => (e.id === event.equipment.id ? event.equipment : e));
          saveStoredEquipment(updated);
          return updated;
        });
      } else if (event.type === 'EQUIPMENT_DELETED') {
        setEquipments((prev) => {
          const updated = prev.filter((e) => e.id !== event.equipmentId);
          saveStoredEquipment(updated);
          return updated;
        });
      } else if (event.type === 'EQUIPMENT_MOVEMENT_RECORDED') {
        setMovements((prev) => {
          const exists = prev.some((m) => m.id === event.movement.id);
          if (exists) return prev;
          const updated = [event.movement, ...prev];
          saveStoredMovements(updated);
          return updated;
        });
      } else if (event.type === 'DELIVERY_TERM_SAVED') {
        setDeliveryTerms((prev) => {
          const idx = prev.findIndex((t) => t.id === event.term.id);
          let updated: DeliveryTerm[];
          if (idx >= 0) {
            updated = [...prev];
            updated[idx] = event.term;
          } else {
            updated = [event.term, ...prev];
          }
          saveStoredDeliveryTerms(updated);
          return updated;
        });
      }
    });

    return () => unsubscribeSync();
  }, []);

  // Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser && firebaseUser.email) {
          const isCorp = validateCorporateDomain(firebaseUser.email, config.allowedDomains);
          if (isCorp) {
            const profile = buildUserProfile(firebaseUser, config.allowedDomains, config.roleAssignments);
            setCurrentUser(profile);
            saveCachedUser(profile);
          } else {
            await logoutUser();
            setCurrentUser(null);
            saveCachedUser(null);
          }
        } else if (!getCachedUser()) {
          setCurrentUser(null);
        }
      } catch (err) {
        logger.error('Erro na verificação de autenticação', err);
      } finally {
        setAuthLoading(false);
      }
    });

    // If we have cached user or auth is initialized, clear loading after brief check
    const timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 400);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [config.allowedDomains, config.roleAssignments]);

  // Real-time Cloud Firestore ticket listener scoped by user role
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToCloudTickets(
      currentUser.role,
      currentUser.email,
      (cloudTickets) => {
        // Unconditionally update tickets state with real-time Firestore list
        setTickets(cloudTickets);
        saveStoredTickets(cloudTickets);
      },
      (err) => {
        logger.warn('Fallback para cache de chamados', err);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.role, currentUser?.email]);

  // Real-time Cloud Firestore inventory listener (Restricted to Administrators)
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const unsubscribeEq = subscribeToEquipment(
      (cloudEquipments) => {
        if (cloudEquipments.length > 0) {
          setEquipments(cloudEquipments);
          saveStoredEquipment(cloudEquipments);
        } else {
          // If Firestore is empty, seed initial equipment
          const local = getStoredEquipment();
          local.forEach((eq) => saveCloudEquipment(eq).catch(() => {}));
        }
      },
      (err) => {
        logger.warn('Fallback para cache de estoque:', err);
      }
    );

    const unsubscribeMov = subscribeToEquipmentMovements(
      null,
      (cloudMovements) => {
        if (cloudMovements.length > 0) {
          setMovements(cloudMovements);
          saveStoredMovements(cloudMovements);
        } else {
          const local = getStoredMovements();
          local.forEach((m) => saveCloudEquipmentMovement(m).catch(() => {}));
        }
      },
      (err) => {
        logger.warn('Fallback para cache de movimentações:', err);
      }
    );

    const unsubscribeTerms = subscribeToDeliveryTerms(
      (cloudTerms) => {
        if (cloudTerms.length > 0) {
          setDeliveryTerms(cloudTerms);
          saveStoredDeliveryTerms(cloudTerms);
        } else {
          const local = getStoredDeliveryTerms();
          local.forEach((t) => saveCloudDeliveryTerm(t).catch(() => {}));
        }
      },
      (err) => {
        logger.warn('Fallback para cache de termos:', err);
      }
    );

    return () => {
      unsubscribeEq();
      unsubscribeMov();
      unsubscribeTerms();
    };
  }, [currentUser?.role]);

  // Real-time Cloud Firestore comments listener when a ticket is selected
  useEffect(() => {
    if (!selectedTicket) {
      setCurrentComments([]);
      return;
    }

    const localComments = getStoredComments(selectedTicket.id);
    setCurrentComments(localComments);

    const unsubscribe = subscribeToCloudComments(selectedTicket.id, (cloudComments) => {
      if (cloudComments.length > 0) {
        setCurrentComments(cloudComments);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedTicket?.id]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      logger.warn('Logout fallback', { error: String(e) });
    }
    setCurrentUser(null);
    saveCachedUser(null);
    setSelectedTicket(null);
  };

  const handleMockLogin = (role: 'admin' | 'user' | 'agent', email: string, name: string) => {
    const domain = email.split('@')[1] || config.primaryDomain;
    const isCorp = validateCorporateDomain(email, config.allowedDomains);
    if (!isCorp) {
      alert(`O e-mail ${email} não pertence ao domínio corporativo ${config.allowedDomains.join(', ')}.`);
      return;
    }

    const assigned = config.roleAssignments?.find((a) => a.email.toLowerCase() === email.toLowerCase());
    const finalRole = assigned ? assigned.role : role;

    const profile: UserProfile = {
      uid: `usr-${Date.now()}`,
      name,
      email,
      role: finalRole,
      department:
        assigned?.department ||
        (finalRole === 'admin' || finalRole === 'agent'
          ? 'Tecnologia da Informação'
          : 'Financeiro & Controladoria'),
      isCorporateVerified: true,
      corporateDomain: domain,
    };
    setCurrentUser(profile);
    saveCachedUser(profile);
  };

  const handleSelectTicketById = (ticketId: string) => {
    const found = tickets.find((t) => t.id === ticketId);
    if (found) {
      setSelectedTicket(found);
    }
  };

  // Notifications
  const handleMarkNotificationAsRead = (id: string) => {
    const updated = markNotificationAsRead(id);
    setNotifications(updated);
  };

  const handleMarkAllNotificationsAsRead = () => {
    const updated = markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleClearAllNotifications = () => {
    clearAllNotifications();
    setNotifications([]);
  };

  // 1. Ticket Created Action
  const handleCreateTicket = async (newTicket: Ticket) => {
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    saveStoredTickets(updated);

    // Instant local cross-tab broadcast (<2ms)
    realtimeSync.broadcast({ type: 'TICKET_CREATED', ticket: newTicket });

    // Cloud Firestore persistence
    saveCloudTicket(newTicket).catch((e) => logger.warn('Sync cloud ticket', e));

    if (currentUser) {
      recordAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: 'ticket_created',
        ticketId: newTicket.id,
        ticketCode: newTicket.code,
        performedByUid: currentUser.uid,
        performedByEmail: currentUser.email,
        performedByName: currentUser.name,
        performedByRole: currentUser.role,
        details: `Chamado ${newTicket.code} criado com prioridade ${newTicket.priority.toUpperCase()}`,
        timestamp: new Date().toISOString(),
        metadata: { category: newTicket.category, department: newTicket.department },
      });
    }

    const notif = createNotification(
      'created',
      newTicket,
      newTicket.requesterEmail,
      newTicket.requesterName,
      `Novo chamado registrado com prioridade ${newTicket.priority.toUpperCase()} no departamento ${newTicket.department}.`,
      config.emailNotificationsEnabled
    );

    saveCloudNotification(notif).catch((e) => logger.warn('Sync cloud notif', e));
    setNotifications(getStoredNotifications());
    setActiveToast(notif);
  };

  // 2. Ticket Status Updated Action
  const handleUpdateStatus = (ticketId: string, status: TicketStatus) => {
    let affectedTicket: Ticket | null = null;
    let oldStatus = '';

    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        oldStatus = t.status;
        const isResolved = status === 'resolvido' || status === 'fechado';
        const modified: Ticket = {
          ...t,
          status,
          updatedAt: new Date().toISOString(),
          resolvedAt: isResolved && !t.resolvedAt ? new Date().toISOString() : t.resolvedAt,
        };
        affectedTicket = modified;
        return modified;
      }
      return t;
    });

    setTickets(updated);
    saveStoredTickets(updated);

    if (affectedTicket) {
      // Instant cross-tab broadcast
      realtimeSync.broadcast({ type: 'TICKET_UPDATED', ticket: affectedTicket });
      saveCloudTicket(affectedTicket).catch((e) => logger.warn('Sync cloud ticket', e));
    }

    if (selectedTicket && selectedTicket.id === ticketId && affectedTicket) {
      setSelectedTicket(affectedTicket);
    }

    if (currentUser && affectedTicket) {
      recordAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: 'status_changed',
        ticketId,
        ticketCode: (affectedTicket as Ticket).code,
        performedByUid: currentUser.uid,
        performedByEmail: currentUser.email,
        performedByName: currentUser.name,
        performedByRole: currentUser.role,
        details: `Status alterado de "${oldStatus}" para "${status}"`,
        previousValue: oldStatus,
        newValue: status,
        timestamp: new Date().toISOString(),
        metadata: { fromStatus: oldStatus, toStatus: status },
      });

      const notif = createNotification(
        'status_updated',
        affectedTicket,
        (affectedTicket as Ticket).requesterEmail,
        (affectedTicket as Ticket).requesterName,
        `O status do chamado foi alterado para "${status.replace('_', ' ').toUpperCase()}".`,
        config.emailNotificationsEnabled
      );
      saveCloudNotification(notif).catch((e) => logger.warn('Sync cloud notif', e));
      setNotifications(getStoredNotifications());
      setActiveToast(notif);
    }
  };

  // 3. Ticket Assigned Action (Atomic Transaction)
  const handleAssignToMe = async (ticketId: string) => {
    if (!currentUser) return;

    try {
      const result = await assignTicketSafely(ticketId, currentUser);

      if (!result.success) {
        alert(result.message);
        return;
      }

      // Update local state
      const updated = tickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            assignedToUid: currentUser.uid,
            assignedToName: currentUser.name,
            assignedToEmail: currentUser.email,
            status: t.status === 'novo' ? ('em_atendimento' as TicketStatus) : t.status,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });

      setTickets(updated);
      saveStoredTickets(updated);

      const refreshed = updated.find((t) => t.id === ticketId);
      if (refreshed) {
        realtimeSync.broadcast({ type: 'TICKET_UPDATED', ticket: refreshed });
      }

      if (refreshed && selectedTicket?.id === ticketId) {
        setSelectedTicket(refreshed);
      }

      recordAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: 'assigned',
        ticketId,
        ticketCode: refreshed?.code,
        performedByUid: currentUser.uid,
        performedByEmail: currentUser.email,
        performedByName: currentUser.name,
        performedByRole: currentUser.role,
        details: `Técnico ${currentUser.name} assumiu o chamado`,
        timestamp: new Date().toISOString(),
      });

      if (refreshed) {
        const notif = createNotification(
          'assigned',
          refreshed,
          refreshed.requesterEmail,
          refreshed.requesterName,
          `O técnico ${currentUser.name} assumiu o atendimento do chamado.`,
          config.emailNotificationsEnabled
        );
        saveCloudNotification(notif).catch((e) => logger.warn('Sync cloud notif', e));
        setNotifications(getStoredNotifications());
        setActiveToast(notif);
      }
    } catch (err) {
      logger.error('Erro na atribuição atômica', err);
      alert('Falha ao assumir o chamado. Tente novamente.');
    }
  };

  // 4. Ticket Priority Updated Action
  const handleUpdatePriority = (ticketId: string, priority: TicketPriority) => {
    const hours = config.slaHours[priority] || 24;
    const slaDueDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    let affected: Ticket | null = null;
    let oldPriority = '';

    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        oldPriority = t.priority;
        const modified = {
          ...t,
          priority,
          slaDueDate,
          updatedAt: new Date().toISOString(),
        };
        affected = modified;
        return modified;
      }
      return t;
    });

    setTickets(updated);
    saveStoredTickets(updated);

    if (affected) {
      realtimeSync.broadcast({ type: 'TICKET_UPDATED', ticket: affected });
      saveCloudTicket(affected).catch((e) => logger.warn('Sync cloud ticket', e));
    }

    if (selectedTicket && selectedTicket.id === ticketId && affected) {
      setSelectedTicket(affected);
    }

    if (currentUser && affected) {
      recordAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: 'priority_changed',
        ticketId,
        ticketCode: (affected as Ticket).code,
        performedByUid: currentUser.uid,
        performedByEmail: currentUser.email,
        performedByName: currentUser.name,
        performedByRole: currentUser.role,
        details: `Prioridade alterada de "${oldPriority}" para "${priority}"`,
        previousValue: oldPriority,
        newValue: priority,
        timestamp: new Date().toISOString(),
        metadata: { fromPriority: oldPriority, toPriority: priority },
      });
    }
  };

  // 5. Add Comment Action
  const handleAddComment = (content: string, isInternal: boolean) => {
    if (!selectedTicket || !currentUser) return;

    const newComment: TicketComment = {
      id: `com-${Date.now()}`,
      ticketId: selectedTicket.id,
      authorUid: currentUser.uid,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      authorPhoto: currentUser.photoURL,
      authorRole: currentUser.role,
      content,
      isInternalNote: isInternal,
      createdAt: new Date().toISOString(),
    };

    addStoredComment(newComment);
    setCurrentComments((prev) => [...prev, newComment]);

    // Check if this is the first staff response
    const isStaff = currentUser.role === 'admin' || currentUser.role === 'agent';
    const isFirstStaffPublicResponse = isStaff && !isInternal && !selectedTicket.firstResponseAt;

    const updatedTickets = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          commentsCount: (t.commentsCount || 0) + 1,
          firstResponseAt: isFirstStaffPublicResponse ? newComment.createdAt : t.firstResponseAt,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    saveStoredTickets(updatedTickets);
    const refreshed = updatedTickets.find((t) => t.id === selectedTicket.id);
    if (refreshed) {
      setSelectedTicket(refreshed);
      realtimeSync.broadcast({ type: 'TICKET_UPDATED', ticket: refreshed });
      realtimeSync.broadcast({ type: 'COMMENT_ADDED', comment: newComment, ticketId: refreshed.id });
    }

    addCloudComment(newComment, (refreshed?.commentsCount || 1)).catch((e) =>
      logger.warn('Sync cloud comment', e)
    );

    recordAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: 'comment_added',
      ticketId: selectedTicket.id,
      ticketCode: selectedTicket.code,
      performedByUid: currentUser.uid,
      performedByEmail: currentUser.email,
      performedByName: currentUser.name,
      performedByRole: currentUser.role,
      details: isInternal
        ? 'Nota interna confidencial adicionada'
        : `Resposta pública enviada: "${content.slice(0, 60)}..."`,
      timestamp: new Date().toISOString(),
    });

    if (!isInternal && refreshed) {
      const recipientEmail =
        currentUser.email === refreshed.requesterEmail
          ? refreshed.assignedToEmail || 'admin@embrag.com.br'
          : refreshed.requesterEmail;
      const recipientName =
        currentUser.email === refreshed.requesterEmail
          ? refreshed.assignedToName || 'Equipe TI Embrag'
          : refreshed.requesterName;

      const notif = createNotification(
        'new_comment',
        refreshed,
        recipientEmail,
        recipientName,
        `${currentUser.name} enviou uma nova resposta: "${content.slice(0, 80)}${content.length > 80 ? '...' : ''}"`,
        config.emailNotificationsEnabled
      );
      saveCloudNotification(notif).catch((e) => logger.warn('Sync cloud notif', e));
      setNotifications(getStoredNotifications());
      setActiveToast(notif);
    }
  };

  const handleSaveConfig = (newConfig: CorporateConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
    saveCloudConfig(newConfig).catch((e) => logger.warn('Sync cloud config', e));

    if (currentUser) {
      const assigned = newConfig.roleAssignments?.find(
        (a) => a.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (assigned && assigned.role !== currentUser.role) {
        const updatedProfile: UserProfile = {
          ...currentUser,
          role: assigned.role,
          department:
            assigned.department ||
            (assigned.role === 'admin' || assigned.role === 'agent'
              ? 'Tecnologia da Informação'
              : currentUser.department),
        };
        setCurrentUser(updatedProfile);
        saveCachedUser(updatedProfile);
      }
    }
  };

  // Inventory Handlers (Restricted to Admin)
  const handleSaveEquipment = async (equipment: Equipment, isNew: boolean) => {
    let updatedList: Equipment[];
    if (isNew) {
      updatedList = [equipment, ...equipments];
    } else {
      updatedList = equipments.map((e) => (e.id === equipment.id ? equipment : e));
    }

    setEquipments(updatedList);
    saveStoredEquipment(updatedList);

    realtimeSync.broadcast({
      type: isNew ? 'EQUIPMENT_CREATED' : 'EQUIPMENT_UPDATED',
      equipment,
    });

    saveCloudEquipment(equipment).catch((e) => logger.warn('Sync cloud equipment', e));

    if (currentUser) {
      recordAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: isNew ? 'equipment_created' : 'equipment_updated',
        performedByUid: currentUser.uid,
        performedByEmail: currentUser.email,
        performedByName: currentUser.name,
        performedByRole: currentUser.role,
        details: `${isNew ? 'Cadastro de equipamento' : 'Edição de equipamento'}: ${equipment.internalCode} - ${equipment.name}`,
        timestamp: new Date().toISOString(),
        metadata: {
          internalCode: equipment.internalCode,
          category: equipment.category,
          status: equipment.status,
        },
      });
    }
  };

  const handleSaveMovement = async (movement: EquipmentMovement, updatedEquipment: Equipment) => {
    // 1. Update equipment state & storage
    const updatedEquipments = equipments.map((e) =>
      e.id === updatedEquipment.id ? updatedEquipment : e
    );
    setEquipments(updatedEquipments);
    saveStoredEquipment(updatedEquipments);

    // 2. Update movements state & storage
    const updatedMovements = [movement, ...movements];
    setMovements(updatedMovements);
    saveStoredMovements(updatedMovements);

    // 3. Cross-tab instant broadcast (<2ms)
    realtimeSync.broadcast({ type: 'EQUIPMENT_UPDATED', equipment: updatedEquipment });
    realtimeSync.broadcast({ type: 'EQUIPMENT_MOVEMENT_RECORDED', movement });

    // 4. Cloud Firestore persistence
    saveCloudEquipment(updatedEquipment).catch((e) => logger.warn('Sync cloud equipment', e));
    saveCloudEquipmentMovement(movement).catch((e) => logger.warn('Sync cloud movement', e));

    if (currentUser) {
      recordAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: 'equipment_moved',
        performedByUid: currentUser.uid,
        performedByEmail: currentUser.email,
        performedByName: currentUser.name,
        performedByRole: currentUser.role,
        details: `Movimentação de equipamento (${movement.type}): ${updatedEquipment.internalCode} - ${updatedEquipment.name}. Nova localização: ${movement.newLocation}. Novo status: ${movement.newStatus}`,
        timestamp: new Date().toISOString(),
        metadata: {
          equipmentId: updatedEquipment.id,
          type: movement.type,
          newStatus: movement.newStatus,
          assignedTo: movement.newAssignedTo,
          location: movement.newLocation,
        },
      });
    }
  };

  const handleUpdateEquipmentPhotos = async (equipmentId: string, newPhotos: string[]) => {
    const found = equipments.find((e) => e.id === equipmentId);
    if (!found) return;

    const updated: Equipment = {
      ...found,
      photos: newPhotos,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = equipments.map((e) => (e.id === equipmentId ? updated : e));
    setEquipments(updatedList);
    saveStoredEquipment(updatedList);

    realtimeSync.broadcast({ type: 'EQUIPMENT_UPDATED', equipment: updated });
    saveCloudEquipment(updated).catch((e) => logger.warn('Sync cloud equipment photos', e));
  };

  const handleSaveDeliveryTerm = async (term: DeliveryTerm) => {
    const existing = deliveryTerms;
    const idx = existing.findIndex((t) => t.id === term.id);
    let updated: DeliveryTerm[];
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = term;
    } else {
      updated = [term, ...existing];
    }

    setDeliveryTerms(updated);
    saveStoredDeliveryTerms(updated);

    realtimeSync.broadcast({ type: 'DELIVERY_TERM_SAVED', term });
    saveCloudDeliveryTerm(term).catch((e) => logger.warn('Sync cloud delivery term', e));

    if (currentUser) {
      recordAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: term.status === 'assinado' ? 'delivery_term_signed' : 'delivery_term_created',
        performedByUid: currentUser.uid,
        performedByEmail: currentUser.email,
        performedByName: currentUser.name,
        performedByRole: currentUser.role,
        details: `Termo de Entrega (${term.protocol}) ${
          term.status === 'assinado' ? 'assinado digitalmente por' : 'gerado para'
        }: ${term.recipientName} (${term.equipmentCode} - ${term.equipmentName})`,
        timestamp: new Date().toISOString(),
        metadata: {
          termId: term.id,
          protocol: term.protocol,
          recipientEmail: term.recipientEmail,
          status: term.status,
          equipmentId: term.equipmentId,
        },
      });
    }
  };

  const handleSaveGasConfig = (newConfig: GoogleAppsScriptSyncConfig) => {
    setGasConfig(newConfig);
    saveStoredGasConfig(newConfig);
  };

  const handleImportEquipments = async (importedList: Partial<Equipment>[]): Promise<number> => {
    let count = 0;
    const nowIso = new Date().toISOString();
    const newEquipments: Equipment[] = [];

    importedList.forEach((item, index) => {
      const code = item.internalCode || `EQP-${Date.now() + index}`;
      const existing = equipments.find(
        (e) => e.internalCode.toLowerCase() === code.toLowerCase()
      );

      if (existing) {
        const merged: Equipment = {
          ...existing,
          ...item,
          id: existing.id,
          updatedAt: nowIso,
        };
        saveCloudEquipment(merged).catch(() => {});
        count++;
      } else {
        const full: Equipment = {
          id: `eqp-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
          internalCode: code,
          assetTag: item.assetTag || '',
          name: item.name || `${item.brand || 'Equipamento'} ${item.model || ''}`.trim(),
          category: item.category || 'notebook',
          brand: item.brand || 'Embrag',
          model: item.model || 'Corporativo',
          serialNumber: item.serialNumber || '',
          status: item.status || 'disponivel',
          condition: item.condition || 'bom',
          branch: item.branch || 'Matriz - São Paulo',
          department: item.department || 'Operações',
          location: item.location || 'Estoque TI',
          assignedTo: item.assignedTo || null,
          entryDate: item.entryDate || nowIso.split('T')[0],
          notes: item.notes || '',
          photos: item.photos || [],
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        newEquipments.push(full);
        saveCloudEquipment(full).catch(() => {});
        count++;
      }
    });

    if (newEquipments.length > 0) {
      const mergedAll = [...newEquipments, ...equipments];
      setEquipments(mergedAll);
      saveStoredEquipment(mergedAll);
    }

    if (currentUser) {
      recordAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: 'gas_sync_performed',
        performedByUid: currentUser.uid,
        performedByEmail: currentUser.email,
        performedByName: currentUser.name,
        performedByRole: currentUser.role,
        details: `Sincronização / Importação de estoque via Google Apps Script: ${count} aparelhos processados.`,
        timestamp: new Date().toISOString(),
      });
    }

    return count;
  };

  // Neutral Initial Loading State (Verifying Auth Session)
  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center font-sans transition-colors select-none ${
          theme === 'dark' ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
      >
        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
          Helpdesk • Verificando sessão corporativa...
        </p>
      </div>
    );
  }

  // Public Layout: Unauthenticated State (Strictly Separated from Internal UI)
  if (!currentUser) {
    return (
      <LoginView
        allowedDomains={config.allowedDomains}
        roleAssignments={config.roleAssignments}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          saveCachedUser(user);
        }}
        mockLogin={handleMockLogin}
      />
    );
  }

  const openTicketsCount = tickets.filter(
    (t) => t.status === 'novo' || t.status === 'em_atendimento' || t.status === 'aguardando_usuario'
  ).length;

  // Private Layout: Authenticated State
  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-150 ${
        theme === 'dark' ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Desktop & Mobile Collapsible Sidebar */}
      <Sidebar
        currentView={viewMode}
        onViewChange={(v) => setViewMode(v)}
        currentUser={currentUser}
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        openTicketsCount={openTicketsCount}
        onOpenManual={(mode = 'user') => {
          setManualInitialMode(mode);
          setManualModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Compact Top Header */}
        <Header
          currentView={viewMode}
          user={currentUser}
          onLogout={handleLogout}
          onOpenNewTicket={() => setIsNewTicketOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          notifications={notifications}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onSelectTicketById={handleSelectTicketById}
          onPreviewEmail={(notif) => setPreviewEmailNotif(notif)}
          allowedDomains={config.allowedDomains}
        />

        {/* Dynamic Page Container: Responsive and full width for modern Kanban */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1700px] mx-auto">
          {viewMode === 'list' && (
            <TicketList
              tickets={tickets}
              currentUser={currentUser}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onOpenNewTicket={() => setIsNewTicketOpen(true)}
            />
          )}

          {viewMode === 'kanban' && (
            <TicketKanban
              tickets={tickets}
              currentUser={currentUser}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onUpdateStatus={handleUpdateStatus}
            />
          )}

          {viewMode === 'stats' && <DashboardStats tickets={tickets} />}

          {viewMode === 'audit' && <AuditLogsViewer currentUser={currentUser} />}

          {viewMode === 'inventory' && (
            currentUser.role === 'admin' ? (
              <TechInventoryView
                equipments={equipments}
                movements={movements}
                deliveryTerms={deliveryTerms}
                gasConfig={gasConfig}
                currentUser={currentUser}
                onSaveEquipment={handleSaveEquipment}
                onSaveMovement={handleSaveMovement}
                onUpdateEquipmentPhotos={handleUpdateEquipmentPhotos}
                onSaveDeliveryTerm={handleSaveDeliveryTerm}
                onSaveGasConfig={handleSaveGasConfig}
                onImportEquipments={handleImportEquipments}
              />
            ) : (
              <div className="p-8 text-center text-rose-500 font-bold bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                Acesso Negado: O Estoque Tecnológico é restrito exclusivamente aos Administradores do Helpdesk.
              </div>
            )
          )}
        </main>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          comments={currentComments}
          currentUser={currentUser}
          onClose={() => setSelectedTicket(null)}
          onAddComment={handleAddComment}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePriority={handleUpdatePriority}
          onAssignToMe={handleAssignToMe}
        />
      )}

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <NewTicketModal
          currentUser={currentUser}
          config={config}
          onClose={() => setIsNewTicketOpen(false)}
          onCreateTicket={handleCreateTicket}
        />
      )}

      {/* Admin Settings Modal */}
      {isSettingsOpen && currentUser.role === 'admin' && (
        <AdminSettingsModal
          config={config}
          onClose={() => setIsSettingsOpen(false)}
          onSaveConfig={handleSaveConfig}
        />
      )}

      {/* Real-time Floating Toast Alert */}
      <ToastAlert
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
        onOpenTicket={(ticketId) => handleSelectTicketById(ticketId)}
        onPreviewEmail={(notif) => setPreviewEmailNotif(notif)}
      />

      {/* Corporate Email Preview Modal */}
      {previewEmailNotif && (
        <EmailPreviewModal
          notification={previewEmailNotif}
          onClose={() => setPreviewEmailNotif(null)}
          onOpenTicket={(ticketId) => handleSelectTicketById(ticketId)}
        />
      )}

      {/* Illustrated User & Admin Manuals Modal */}
      <UserManualModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        currentUser={currentUser}
        initialMode={manualInitialMode}
      />
    </div>
  );
}

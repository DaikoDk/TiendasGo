import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileSearch,
  FileText,
  LucideAngularModule,
  Package,
  ScrollText,
  Shield,
  ShoppingCart,
  Store,
  Tags,
  Truck,
  Users,
  Warehouse,
  Boxes
} from 'lucide-angular';

interface SidebarItem {
  label: string;
  icon: typeof Building2;
  route?: string;
  exact?: boolean;
}

interface SidebarSection {
  title: string;
  icon: typeof Building2;
  items: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  protected readonly isCollapsed = signal(false);
  protected readonly icons = {
    Building2,
    ChevronLeft,
    ChevronRight
  };

  protected readonly sections: SidebarSection[] = [
    {
      title: 'Administracion',
      icon: Building2,
      items: [
        {
          label: 'Empresa',
          icon: Building2
        },
        {
          label: 'Sedes',
          icon: Store,
          route: '/dashboard/sedes'
        },
        {
          label: 'Usuarios',
          icon: Users,
          route: '/dashboard/usuarios'
        },
        {
          label: 'Roles',
          icon: Shield
        },
        {
          label: 'Permisos',
          icon: BadgeCheck
        },
        {
          label: 'Impuestos',
          icon: CircleDollarSign
        },
        {
          label: 'Auditoria',
          icon: FileSearch
        }
      ]
    },
    {
      title: 'Logistica',
      icon: Package,
      items: [
        {
          label: 'Productos',
          icon: Package,
          route: '/dashboard/inventario'
        },
        {
          label: 'Categorias',
          icon: Tags
        },
        {
          label: 'Marcas',
          icon: Boxes
        },
        {
          label: 'StockSede',
          icon: Warehouse
        },
        {
          label: 'Kardex',
          icon: ClipboardList
        }
      ]
    },
    {
      title: 'Compras',
      icon: ShoppingCart,
      items: [
        {
          label: 'Proveedores',
          icon: Truck
        },
        {
          label: 'Compras',
          icon: ShoppingCart,
          route: '/dashboard/compras'
        },
        {
          label: 'Encabezado',
          icon: FileText
        },
        {
          label: 'Detalle',
          icon: ScrollText
        }
      ]
    }
  ];

  protected toggleCollapsed(): void {
    this.isCollapsed.update((value) => !value);
  }
}
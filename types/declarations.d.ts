declare module 'lucide-react' {
  import * as React from 'react';
  export const Plus: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const X: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const XIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Save: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Clock: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const DollarSign: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Trash2: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Check: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const ChevronRight: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Circle: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const CircleIcon: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Search: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const ExternalLink: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const ArrowRight: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const ArrowLeft: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const FileText: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Layers: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Play: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Pencil: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Edit: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Edit3: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const PanelLeft: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const PanelRight: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const PanelLeftClose: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const PanelRightClose: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Sliders: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Settings: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const ChevronDown: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const ChevronUp: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const RotateCcw: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Info: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const AlertCircle: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const User: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Wrench: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const CheckCircle2: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Undo: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const Redo: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const RefreshCw: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const AlertTriangle: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
  export const LogOut: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>;
}

declare module '@base-ui/react/button' {
  export namespace Button {
    export type Props = any;
  }
  export const Button: any;
}

declare module '@base-ui/react/dialog' {
  export namespace Dialog {
    export namespace Root {
      export type Props = any;
    }
    export const Root: any;

    export namespace Trigger {
      export type Props = any;
    }
    export const Trigger: any;

    export namespace Portal {
      export type Props = any;
    }
    export const Portal: any;

    export namespace Close {
      export type Props = any;
    }
    export const Close: any;

    export namespace Backdrop {
      export type Props = any;
    }
    export const Backdrop: any;

    export namespace Popup {
      export type Props = any;
    }
    export const Popup: any;

    export namespace Title {
      export type Props = any;
    }
    export const Title: any;

    export namespace Description {
      export type Props = any;
    }
    export const Description: any;
  }
  export const Dialog: any;
}

declare module '@base-ui/react/menu' {
  export namespace Menu {
    export namespace Root {
      export type Props = any;
    }
    export const Root: any;

    export namespace Portal {
      export type Props = any;
    }
    export const Portal: any;

    export namespace Trigger {
      export type Props = any;
    }
    export const Trigger: any;

    export namespace Popup {
      export type Props = any;
    }
    export const Popup: any;

    export namespace Positioner {
      export type Props = any;
    }
    export const Positioner: any;

    export namespace Group {
      export type Props = any;
    }
    export const Group: any;

    export namespace GroupLabel {
      export type Props = any;
    }
    export const GroupLabel: any;

    export namespace Item {
      export type Props = any;
    }
    export const Item: any;

    export namespace SubmenuRoot {
      export type Props = any;
    }
    export const SubmenuRoot: any;

    export namespace SubmenuTrigger {
      export type Props = any;
    }
    export const SubmenuTrigger: any;

    export namespace CheckboxItem {
      export type Props = any;
    }
    export const CheckboxItem: any;
    export const CheckboxItemIndicator: any;

    export namespace RadioGroup {
      export type Props = any;
    }
    export const RadioGroup: any;

    export namespace RadioItem {
      export type Props = any;
    }
    export const RadioItem: any;
    export const RadioItemIndicator: any;

    export namespace Separator {
      export type Props = any;
    }
    export const Separator: any;
  }
  export const Menu: any;
}

declare module '@base-ui/react/input' {
  export namespace Input {
    export type Props = any;
  }
  export const Input: any;
}

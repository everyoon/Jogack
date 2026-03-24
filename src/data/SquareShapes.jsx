export const SquareShapes = [
  {
    id: 'sq-01',
    label: '정사각',
    viewBox: '0 0 100 100',
    svg: <rect x="4" y="4" width="92" height="92" fill="currentColor" />,
  },
  {
    id: 'sq-02',
    label: '정사각 둥근',
    viewBox: '0 0 100 100',
    svg: (
      <path
        d="M4 9C4 6.23858 6.23858 4 9 4H91C93.7614 4 96 6.23858 96 9V91C96 93.7614 93.7614 96 91 96H9C6.23858 96 4 93.7614 4 91V9Z"
        fill="currentColor"
      />
    ),
  },
  {
    id: 'sq-03',
    label: '가로',
    viewBox: '0 0 100 100',
    svg: <rect x="4" y="12.5" width="92" height="75" fill="currentColor" />,
  },
  {
    id: 'sq-04',
    label: '가로 둥근',
    viewBox: '0 0 100 100',
    svg: (
      <path
        d="M4 17.1512C4 14.5824 6.0824 12.5 8.65116 12.5H91.3488C93.9176 12.5 96 14.5824 96 17.1512V82.8488C96 85.4176 93.9176 87.5 91.3488 87.5H8.65116C6.0824 87.5 4 85.4176 4 82.8488V17.1512Z"
        fill="currentColor"
      />
    ),
  },
  {
    id: 'sq-05',
    label: '세로',
    viewBox: '0 0 100 100',
    svg: <rect x="12.5" y="4" width="75" height="92" fill="currentColor" />,
  },
  {
    id: 'sq-06',
    label: '세로 둥근',
    viewBox: '0 0 100 100',
    svg: (
      <path
        d="M12.5 8.65116C12.5 6.0824 14.5824 4 17.1512 4H82.8488C85.4176 4 87.5 6.0824 87.5 8.65116V91.3488C87.5 93.9176 85.4176 96 82.8488 96H17.1512C14.5824 96 12.5 93.9176 12.5 91.3488V8.65116Z"
        fill="currentColor"
      />
    ),
  },
  {
    id: 'sq-07',
    label: '평행사변형',
    viewBox: '0 0 100 100',
    svg: <path d="M29.6482 25.5555H100L70.3517 74.4444H0L29.6482 25.5555Z" fill="currentColor" />,
  },
];

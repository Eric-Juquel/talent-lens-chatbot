export function PageLoader() {
  return (
    <div
      role='status'
      aria-label='Loading page'
      className='flex min-h-[50vh] items-center justify-center'
    >
      <div
        className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'
        aria-hidden='true'
      />
    </div>
  );
}

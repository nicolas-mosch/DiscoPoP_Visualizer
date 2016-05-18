SHELL=/bin/sh
BENCHMARK=cg
BENCHMARKU=CG

HEADERS=globals.h npbparams.h

include ../config/make.def

include ../sys/make.common

ifdef binaries
OBJS = primary.o \
       ${COMMON}/print_results.o  \
       ${COMMON}/${RAND}.o \
       ${COMMON}/c_timers.o \
       ${COMMON}/wtime.o

PRIMARIES = cg.o
else
OBJS = primary.bc \
       ${COMMON}/print_results.bc  \
       ${COMMON}/${RAND}.bc \
       ${COMMON}/c_timers.bc \
       ${COMMON}/wtime.bc

PRIMARIES = cg.bc
endif

${PROGRAM}: config ${OBJS}
	${CLINK} ${CLINKFLAGS} -o ${PROGRAM} ${OBJS} ${C_LIB}

primary.o: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.o ${PRIMARIES}

primary.bc: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.bc ${PRIMARIES}

ifdef binaries
.c.o:
	${CCOMPILE} $<
else
%.bc:%.c ${HEADERS}
	${CCOMPILE} $<
endif

cg.o:		cg.c  globals.h npbparams.h
cg.bc:		cg.c  globals.h npbparams.h

clean:
	- rm -f *.o *.bc *~ 
	- rm -f npbparams.h core




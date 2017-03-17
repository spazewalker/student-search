import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

import { SearchHelper } from '../../helpers/search.helper';
import { SearchService } from '../../services/search.service';
import { Student } from '../../models/student.model';

const FACTOR = 50;

@Component({
  selector: 'search-root',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  students: Array<Student> = [];
  private loading = true;

  private maxIndex: number;
  private allResults: Array<Student> = [];
  private result: Array<Student> = [];

  private deps: Array<string> = [];
  private progs: Array<string> = [];
  private bloodgrps: Array<string> = [];
  private halls: Array<string> = [];
  private genders: Array<string> = [];
  private years: Array<string> = [];

  private latestTerm: string = '';
  private currentYear = 'Any';
  private currentGender = 'Any';
  private currentHall = 'Any';
  private currentProg = 'Any';
  private currentDep = 'Any';
  private currentGrp = 'Any';
  private currentAdd = '';

  private searchTerms = new Subject<string>();
  private addTerms = new Subject<string>();

  constructor(private search: SearchService) {}

  searchTerm(term: string): void {
    this.searchTerms.next(term);
  }
  addTerm(term: string): void {
    this.addTerms.next(term);
  }

  onlyUnique<T>(value: T, index: number, self: Array<T>): boolean {
    return self.indexOf(value) === index;
  }

  ngOnInit(): void {

    this.searchTerms
      .debounceTime(300)        // wait 300ms after each keystroke before considering the term
      .distinctUntilChanged()   // ignore if next search term is same as previous
      .subscribe(term => {
        if (term !== '') {
          this.latestTerm = term;
          this.update();
        } else {
          this.latestTerm = '';
          this.result = [];
        }
      });

    this.addTerms
      .debounceTime(300)
      .distinctUntilChanged()
      .subscribe(term => {
        this.currentAdd = term;
        this.update();
      });

    this.search.getInformation().then((res) => {

      this.students = res;

      const deps = res.map((val) => SearchHelper.ParseBranch(val.d));
      this.deps = deps.filter(this.onlyUnique).sort();

      const prog = res.map((val) => val.p);
      this.progs = prog.filter(this.onlyUnique).sort();

      const bloodgrp = res.map((val) => val.b);
      this.bloodgrps = bloodgrp.filter(this.onlyUnique).filter((elem) => elem !== 'Not Available').sort();

      const hall = res.map((val) => val.h);
      this.halls = hall.filter(this.onlyUnique).filter((elem) => elem !== '' ).sort();

      const gender = res.map((val) => val.g);
      this.genders = gender.filter(this.onlyUnique).filter((e) => e !== 'null').sort();

      const year = res.map((val) => SearchHelper.ParseYear(val.i));
      this.years = year.filter(this.onlyUnique).sort();

      this.loading = false;

    });

  }

  update(): void {
    if (this.latestTerm.length > 2 || this.currentYear !== 'Any' || this.currentGender !== 'Any' ||
        this.currentHall !== 'Any' || this.currentProg !== 'Any' || this.currentDep !== 'Any' || this.currentGrp !== 'Any' ||
        this.currentAdd !== '') {
      this.result = [];
      this.allResults = this.search.getResults(this.students, this.latestTerm, this.currentYear, this.currentGender,
                                               this.currentHall, this.currentProg, this.currentDep, this.currentGrp,
                                               this.currentAdd);
      this.result = this.result.concat(this.allResults.slice(0, FACTOR));
      this.maxIndex = 50;
    } else {
      this.allResults = [];
      this.result = [];
    }
  }

  addMoreElements() {
    if (this.maxIndex < this.allResults.length) {
      this.result = this.result.concat(this.allResults.slice(this.maxIndex, this.maxIndex + FACTOR));
      this.maxIndex += FACTOR;
    }
  }

}